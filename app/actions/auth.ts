'use server';

import { redirect } from 'next/navigation';
import { db, ROLES, type Role } from '@/lib/db';
import { clearAttempts, hashPassword, noteFailedAttempt, signInUser, signOutUser, tooManyAttempts, verifyPassword } from '@/lib/auth';

/** What a sign-up or log-in form gets back: a message to show, and what was typed (kept on errors). */
export type AuthState = { error?: string; fields?: Record<string, string> } | undefined;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const text = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim();

export async function signup(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const name = text(fd, 'name'), email = text(fd, 'email').toLowerCase(), city = text(fd, 'city');
  const role = text(fd, 'role') as Role, password = String(fd.get('password') ?? '');
  const fields = { name, email, city, role };
  if (name.length < 2 || name.length > 80) return { error: 'Please write your name.', fields };
  if (!EMAIL.test(email) || email.length > 254) return { error: 'That email address doesn’t look right.', fields };
  if (!ROLES.includes(role)) return { error: 'Please choose: student, manufacturer or partner.', fields };
  if (city.length > 80) return { error: 'Please shorten your city.', fields };
  if (password.length < 8) return { error: 'Your password needs at least 8 characters.', fields };
  if (password.length > 200) return { error: 'That password is too long.', fields };

  const c = await db();
  const taken = await c.execute({ sql: 'SELECT 1 FROM users WHERE email = ?', args: [email] });
  if (taken.rows.length) return { error: 'There’s already an account with this email. Log in instead.', fields };
  const created = await c.execute({
    sql: 'INSERT INTO users (name, email, role, city, password_hash) VALUES (?, ?, ?, ?, ?) RETURNING id',
    args: [name, email, role, city || null, await hashPassword(password)],
  });
  await signInUser(Number(created.rows[0].id), 'signup');
  redirect('/account');
}

export async function login(_prev: AuthState, fd: FormData): Promise<AuthState> {
  const email = text(fd, 'email').toLowerCase(), password = String(fd.get('password') ?? '');
  const fields = { email };
  if (!email || !password) return { error: 'Please write your email and password.', fields };
  if (tooManyAttempts(email)) return { error: 'Too many tries. Please wait a few minutes and try again.', fields };

  const c = await db();
  const r = await c.execute({ sql: 'SELECT id, password_hash FROM users WHERE email = ?', args: [email] });
  const row = r.rows[0];
  if (!row || !(await verifyPassword(password, String(row.password_hash)))) {
    noteFailedAttempt(email);
    return { error: 'That email and password don’t match.', fields };
  }
  clearAttempts(email);
  await signInUser(Number(row.id), 'login');
  redirect('/account');
}

export async function logout() {
  await signOutUser();
  redirect('/');
}
