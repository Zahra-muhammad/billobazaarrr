import 'server-only';
import { createHash, randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { db, type Role } from './db';

/**
 * Accounts and sessions.
 * - Passwords are never stored: only a scrypt hash with its own random salt.
 * - A session is a random token in an httpOnly cookie (scripts on the page can't read it); the
 *   database keeps only a SHA-256 hash of the token, so a leaked database can't be used to sign in.
 * - The admin is not a user account: the admin username and password come from the environment
 *   (ADMIN_USERNAME / ADMIN_PASSWORD in .env.local here, or the host's settings online).
 */

const USER_COOKIE = 'bb_session';
const ADMIN_COOKIE = 'bb_admin';
const USER_DAYS = 30;
const ADMIN_HOURS = 12;

// ---------- passwords ----------
const N = 16384, R = 8, P = 1, KEYLEN = 64;
const scryptAsync = (password: string, salt: Buffer) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, KEYLEN, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 }, (err, key) => (err ? reject(err) : resolve(key))),
  );

export async function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = await scryptAsync(password, salt);
  return `scrypt$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, saltB64, keyB64] = stored.split('$');
  if (scheme !== 'scrypt' || !saltB64 || !keyB64) return false;
  const key = await scryptAsync(password, Buffer.from(saltB64, 'base64'));
  const expected = Buffer.from(keyB64, 'base64');
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/** same-time comparison of two strings, so the time taken gives nothing away */
export function safeEqual(a: string, b: string) {
  const ha = createHash('sha256').update(a).digest(), hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

// ---------- slowing down repeated wrong passwords ----------
const attempts = new Map<string, { n: number; until: number }>();
const WINDOW = 10 * 60 * 1000, MAX = 8;
/** true when this key (an email or the admin name) has had too many wrong tries lately */
export function tooManyAttempts(key: string) {
  const a = attempts.get(key);
  return !!a && a.until > Date.now() && a.n >= MAX;
}
export function noteFailedAttempt(key: string) {
  const a = attempts.get(key);
  if (!a || a.until < Date.now()) attempts.set(key, { n: 1, until: Date.now() + WINDOW });
  else a.n += 1;
}
export function clearAttempts(key: string) {
  attempts.delete(key);
}

// ---------- sessions ----------
const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');
const cookieOptions = (expires: Date) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  expires,
});

async function startSession(userId: number | null) {
  const token = randomBytes(32).toString('base64url');
  const isAdmin = userId === null;
  const expires = new Date(Date.now() + (isAdmin ? ADMIN_HOURS * 3600e3 : USER_DAYS * 86400e3));
  const c = await db();
  await c.execute({
    sql: 'INSERT INTO sessions (token_hash, user_id, is_admin, expires_at) VALUES (?, ?, ?, ?)',
    args: [hashToken(token), userId, isAdmin ? 1 : 0, expires.toISOString()],
  });
  (await cookies()).set(isAdmin ? ADMIN_COOKIE : USER_COOKIE, token, cookieOptions(expires));
}

async function endSession(cookieName: string) {
  const store = await cookies();
  const token = store.get(cookieName)?.value;
  if (token) {
    const c = await db();
    await c.execute({ sql: 'DELETE FROM sessions WHERE token_hash = ?', args: [hashToken(token)] });
  }
  store.delete(cookieName);
}

// ---------- people ----------
export type CurrentUser = { id: number; name: string; email: string; role: Role };

/** Signs this person in: a new session, and a line in the sign-in log. */
export async function signInUser(userId: number, kind: 'signup' | 'login') {
  const c = await db();
  await c.execute({ sql: "UPDATE users SET last_login_at = datetime('now'), login_count = login_count + 1 WHERE id = ?", args: [userId] });
  await c.execute({ sql: 'INSERT INTO logins (user_id, kind) VALUES (?, ?)', args: [userId, kind] });
  await startSession(userId);
}

export const signOutUser = () => endSession(USER_COOKIE);

/** The signed-in person, or null. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(USER_COOKIE)?.value;
  if (!token) return null;
  const c = await db();
  const r = await c.execute({
    sql: `SELECT u.id, u.name, u.email, u.role FROM sessions s JOIN users u ON u.id = s.user_id
          WHERE s.token_hash = ? AND s.is_admin = 0 AND s.expires_at > ?`,
    args: [hashToken(token), new Date().toISOString()],
  });
  const row = r.rows[0];
  return row ? { id: Number(row.id), name: String(row.name), email: String(row.email), role: row.role as Role } : null;
}

// ---------- the admin ----------
/** The admin's username and password, if they have been set. */
export function adminCredentials() {
  const username = process.env.ADMIN_USERNAME, password = process.env.ADMIN_PASSWORD;
  return username && password ? { username, password } : null;
}

export const startAdminSession = () => startSession(null);
export const signOutAdmin = () => endSession(ADMIN_COOKIE);

/** Is the admin signed in? Every admin page and action checks this itself. */
export async function isAdmin() {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const c = await db();
  const r = await c.execute({
    sql: 'SELECT 1 FROM sessions WHERE token_hash = ? AND is_admin = 1 AND expires_at > ?',
    args: [hashToken(token), new Date().toISOString()],
  });
  return r.rows.length > 0;
}
