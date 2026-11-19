'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db, type Role } from '@/lib/db';
import {
  adminCredentials, clearAttempts, dummyPasswordHash, endOtherAdminSessions, getAdmin, hashPassword, noteFailedAttempt,
  safeEqual, signOutAdmin, startAdminSession, tooManyAttempts, verifyPassword,
} from '@/lib/auth';
import { sendToPeople, type Recipient } from '@/lib/mail';

export type AdminSignInState = { error?: string } | undefined;
export type SendState = { ok: boolean; message: string } | undefined;
export type TeamState = { ok: boolean; message: string } | undefined;
export type DeleteState = { ok: boolean; message: string } | undefined;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_ADMIN_PASSWORD = 10;

/**
 * Signs in the main admin (the username and password in the site's settings) or an admin added
 * in the panel (who signs in with their email and their own password).
 */
export async function adminSignIn(_prev: AdminSignInState, fd: FormData): Promise<AdminSignInState> {
  const username = String(fd.get('username') ?? '').trim(), password = String(fd.get('password') ?? '');
  if (!username || !password) return { error: 'Please write your username (or email) and password.' };
  const key = `admin:${username.toLowerCase()}`;
  if (tooManyAttempts(key)) return { error: 'Too many tries. Please wait a few minutes and try again.' };

  // the main admin: both parts are always compared, so the time taken gives nothing away
  const creds = adminCredentials();
  const userOk = creds ? safeEqual(username, creds.username) : false;
  const passOk = creds ? safeEqual(password, creds.password) : false;
  if (userOk && passOk) {
    clearAttempts(key);
    await startAdminSession(null);
    redirect('/admin');
  }

  // an added admin
  const c = await db();
  const r = await c.execute({ sql: 'SELECT id, password_hash FROM admins WHERE email = ?', args: [username.toLowerCase()] });
  const row = r.rows[0];
  const ok = await verifyPassword(password, row ? String(row.password_hash) : await dummyPasswordHash());
  if (!row || !ok) {
    noteFailedAttempt(key);
    return { error: 'Wrong username or password.' };
  }
  clearAttempts(key);
  await startAdminSession(Number(row.id));
  redirect('/admin');
}

export async function adminSignOut() {
  await signOutAdmin();
  redirect('/admin/signin');
}

/** The main admin adds someone as an admin: they sign in with this email and password. */
export async function addAdmin(_prev: TeamState, fd: FormData): Promise<TeamState> {
  const me = await getAdmin();
  if (!me) return { ok: false, message: 'Your admin session has ended. Please sign in again.' };
  if (!me.isOwner) return { ok: false, message: 'Only the main admin can add admins.' };
  const name = String(fd.get('name') ?? '').trim(), email = String(fd.get('email') ?? '').trim().toLowerCase();
  const password = String(fd.get('password') ?? '');
  if (name.length < 2 || name.length > 80) return { ok: false, message: 'Write their name.' };
  if (!EMAIL.test(email) || email.length > 254) return { ok: false, message: 'That email address doesn’t look right.' };
  if (password.length < MIN_ADMIN_PASSWORD) return { ok: false, message: `The password needs at least ${MIN_ADMIN_PASSWORD} characters.` };
  if (password.length > 200) return { ok: false, message: 'That password is too long.' };
  const c = await db();
  const taken = await c.execute({ sql: 'SELECT 1 FROM admins WHERE email = ?', args: [email] });
  if (taken.rows.length) return { ok: false, message: 'That email is already an admin.' };
  await c.execute({
    sql: 'INSERT INTO admins (name, email, password_hash, added_by) VALUES (?, ?, ?, ?)',
    args: [name, email, await hashPassword(password), me.name],
  });
  revalidatePath('/admin');
  return { ok: true, message: `${name} is now an admin. Send them the sign-in page (/admin/signin), their email and this password privately.` };
}

/**
 * The main admin deletes people (the ones ticked in the list): their account, their sessions
 * (so they're signed out) and their sign-in history, all at once. This can't be undone.
 */
export async function deletePeople(_prev: DeleteState, fd: FormData): Promise<DeleteState> {
  const me = await getAdmin();
  if (!me) return { ok: false, message: 'Your admin session has ended. Please sign in again.' };
  if (!me.isOwner) return { ok: false, message: 'Only the main admin can delete people.' };
  const ids = [...new Set(fd.getAll('ids').map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 5000);
  if (!ids.length) return { ok: false, message: 'Tick the people to delete first.' };
  const q = ids.map(() => '?').join(',');
  const c = await db();
  await c.batch([
    { sql: `DELETE FROM logins WHERE user_id IN (${q})`, args: ids },
    { sql: `DELETE FROM sessions WHERE user_id IN (${q})`, args: ids },
    { sql: `DELETE FROM users WHERE id IN (${q})`, args: ids },
  ], 'write');
  revalidatePath('/admin');
  return { ok: true, message: `Deleted ${ids.length} ${ids.length === 1 ? 'person' : 'people'}.` };
}

/** The main admin removes an admin: they're signed out at once. */
export async function removeAdmin(fd: FormData) {
  const me = await getAdmin();
  if (!me?.isOwner) return;
  const id = Number(fd.get('id'));
  if (!Number.isInteger(id) || id <= 0) return;
  const c = await db();
  await c.execute({ sql: 'DELETE FROM admin_sessions WHERE admin_id = ?', args: [id] });
  await c.execute({ sql: 'DELETE FROM admins WHERE id = ?', args: [id] });
  revalidatePath('/admin');
}

/** An added admin changes their own password (the main admin's is in the site's settings). */
export async function changeAdminPassword(_prev: TeamState, fd: FormData): Promise<TeamState> {
  const me = await getAdmin();
  if (!me) return { ok: false, message: 'Your admin session has ended. Please sign in again.' };
  if (me.isOwner || me.id === null) return { ok: false, message: 'The main admin’s password is set in the site’s settings (ADMIN_PASSWORD).' };
  const current = String(fd.get('current') ?? ''), next = String(fd.get('next') ?? ''), again = String(fd.get('again') ?? '');
  if (next.length < MIN_ADMIN_PASSWORD) return { ok: false, message: `Your new password needs at least ${MIN_ADMIN_PASSWORD} characters.` };
  if (next.length > 200) return { ok: false, message: 'That password is too long.' };
  if (next !== again) return { ok: false, message: 'The two new passwords don’t match.' };
  const c = await db();
  const r = await c.execute({ sql: 'SELECT password_hash FROM admins WHERE id = ?', args: [me.id] });
  if (!r.rows[0] || !(await verifyPassword(current, String(r.rows[0].password_hash)))) return { ok: false, message: 'Your current password isn’t right.' };
  await c.execute({ sql: 'UPDATE admins SET password_hash = ? WHERE id = ?', args: [await hashPassword(next), me.id] });
  await endOtherAdminSessions(me.id);
  return { ok: true, message: 'Your password is changed. You’re signed out everywhere else.' };
}

const AUDIENCES: Record<string, string> = { everyone: 'Everyone', student: 'All students', manufacturer: 'All manufacturers', partner: 'All partners', selected: 'Selected people' };

/** Emails a group (or the people ticked in the list). Recipients are looked up here, never taken from the page. */
export async function sendEmail(_prev: SendState, fd: FormData): Promise<SendState> {
  const me = await getAdmin();
  if (!me) return { ok: false, message: 'Your admin session has ended. Please sign in again.' };
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
    sql: 'INSERT INTO emails (audience, subject, body, recipients, delivered, status, note, sent_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    args: [`${AUDIENCES[audience]} (${people.length})`, subject, body, people.length, result.delivered, status, note ?? null, me.name],
  });
  revalidatePath('/admin');

  const n = (k: number) => `${k} ${k === 1 ? 'person' : 'people'}`;
  if (!result.configured) return { ok: false, message: `Saved, not sent: email sending isn’t set up yet (it would have gone to ${n(people.length)}).` };
  if (result.delivered === people.length) return { ok: true, message: `Sent to ${n(people.length)}.` };
  return { ok: false, message: `Sent to ${n(result.delivered)} of ${people.length}. ${result.error ?? ''}`.trim() };
}
