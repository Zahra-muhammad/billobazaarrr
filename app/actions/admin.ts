'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db, type Role } from '@/lib/db';
import { adminCredentials, clearAttempts, isAdmin, noteFailedAttempt, safeEqual, signOutAdmin, startAdminSession, tooManyAttempts } from '@/lib/auth';
import { sendToPeople, type Recipient } from '@/lib/mail';

export type AdminSignInState = { error?: string } | undefined;
export type SendState = { ok: boolean; message: string } | undefined;

export async function adminSignIn(_prev: AdminSignInState, fd: FormData): Promise<AdminSignInState> {
  const creds = adminCredentials();
  if (!creds) return { error: 'The admin login isn’t set up yet: add ADMIN_USERNAME and ADMIN_PASSWORD to the site’s settings.' };
  if (tooManyAttempts('admin')) return { error: 'Too many tries. Please wait a few minutes and try again.' };
  const username = String(fd.get('username') ?? '').trim(), password = String(fd.get('password') ?? '');
  // both are compared every time, so the response time doesn't hint which one was wrong
  const userOk = safeEqual(username, creds.username), passOk = safeEqual(password, creds.password);
  if (!userOk || !passOk) {
    noteFailedAttempt('admin');
    return { error: 'Wrong username or password.' };
  }
  clearAttempts('admin');
  await startAdminSession();
  redirect('/admin');
}

export async function adminSignOut() {
  await signOutAdmin();
  redirect('/admin/signin');
}

const AUDIENCES: Record<string, string> = { everyone: 'Everyone', student: 'All students', manufacturer: 'All manufacturers', partner: 'All partners', selected: 'Selected people' };

/** Emails a group (or the people ticked in the list). Recipients are looked up here, never taken from the page. */
export async function sendEmail(_prev: SendState, fd: FormData): Promise<SendState> {
  if (!(await isAdmin())) return { ok: false, message: 'Your admin session has ended. Please sign in again.' };
  const audience = String(fd.get('audience') ?? '');
  const subject = String(fd.get('subject') ?? '').trim(), body = String(fd.get('body') ?? '').trim();
  if (!(audience in AUDIENCES)) return { ok: false, message: 'Choose who to send it to.' };
  if (!subject || subject.length > 200) return { ok: false, message: 'Write a subject (up to 200 characters).' };
  if (!body || body.length > 20000) return { ok: false, message: 'Write a message.' };

  const c = await db();
  let people: Recipient[] = [];
  if (audience === 'selected') {
    const ids = fd.getAll('ids').map(Number).filter((n) => Number.isInteger(n) && n > 0).slice(0, 5000);
    if (!ids.length) return { ok: false, message: 'Tick at least one person in the list first.' };
    const r = await c.execute({ sql: `SELECT name, email FROM users WHERE id IN (${ids.map(() => '?').join(',')})`, args: ids });
    people = r.rows.map((x) => ({ name: String(x.name), email: String(x.email) }));
  } else {
    const r = audience === 'everyone'
      ? await c.execute('SELECT name, email FROM users')
      : await c.execute({ sql: 'SELECT name, email FROM users WHERE role = ?', args: [audience as Role] });
    people = r.rows.map((x) => ({ name: String(x.name), email: String(x.email) }));
  }
  if (!people.length) return { ok: false, message: 'There’s no one in that group yet.' };

  const result = await sendToPeople(people, subject, body);
  const status = !result.configured ? 'saved' : result.delivered === people.length ? 'sent' : result.delivered > 0 ? 'partly sent' : 'not sent';
  const note = !result.configured ? 'Email sending isn’t set up yet, so this was saved but not sent.' : result.error;
  await c.execute({
    sql: 'INSERT INTO emails (audience, subject, body, recipients, delivered, status, note) VALUES (?, ?, ?, ?, ?, ?, ?)',
    args: [`${AUDIENCES[audience]} (${people.length})`, subject, body, people.length, result.delivered, status, note ?? null],
  });
  revalidatePath('/admin');

  const n = (k: number) => `${k} ${k === 1 ? 'person' : 'people'}`;
  if (!result.configured) return { ok: false, message: `Saved, not sent: email sending isn’t set up yet (it would have gone to ${n(people.length)}).` };
  if (result.delivered === people.length) return { ok: true, message: `Sent to ${n(people.length)}.` };
  return { ok: false, message: `Sent to ${n(result.delivered)} of ${people.length}. ${result.error ?? ''}`.trim() };
}
