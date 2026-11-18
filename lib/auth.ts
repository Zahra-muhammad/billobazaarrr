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

async function startSession(userId: number) {
  const token = randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + USER_DAYS * 86400e3);
  const c = await db();
  await c.execute({
    sql: 'INSERT INTO sessions (token_hash, user_id, is_admin, expires_at) VALUES (?, ?, 0, ?)',
    args: [hashToken(token), userId, expires.toISOString()],
  });
  (await cookies()).set(USER_COOKIE, token, cookieOptions(expires));
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

// ---------- admins ----------
/**
 * The main admin's username and password, from the site's settings. The main admin can always
 * sign in (so the site can't be locked out) and is the only one who can add or remove admins.
 */
export function adminCredentials() {
  const username = process.env.ADMIN_USERNAME, password = process.env.ADMIN_PASSWORD;
  return username && password ? { username, password } : null;
}
/** a fingerprint of the main login: when ADMIN_USERNAME or ADMIN_PASSWORD changes, old sessions stop working */
const ownerKey = () => {
  const creds = adminCredentials();
  return creds ? createHash('sha256').update(`${creds.username}
${creds.password}`).digest('hex') : null;
};

/** Who is signed in to the admin panel: the main admin (id null) or an added admin. */
export type AdminUser = { id: number | null; name: string; email: string | null; isOwner: boolean };

/** Signs in the main admin (null) or an added admin (their id). */
export async function startAdminSession(adminId: number | null) {
  const token = randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + ADMIN_HOURS * 3600e3);
  const c = await db();
  await c.execute({
    sql: 'INSERT INTO admin_sessions (token_hash, admin_id, owner_key, expires_at) VALUES (?, ?, ?, ?)',
    args: [hashToken(token), adminId, adminId === null ? ownerKey() : null, expires.toISOString()],
  });
  if (adminId !== null) await c.execute({ sql: "UPDATE admins SET last_login_at = datetime('now') WHERE id = ?", args: [adminId] });
  (await cookies()).set(ADMIN_COOKIE, token, cookieOptions(expires));
}

export async function signOutAdmin() {
  const store = await cookies();
  const token = store.get(ADMIN_COOKIE)?.value;
  if (token) {
    const c = await db();
    await c.execute({ sql: 'DELETE FROM admin_sessions WHERE token_hash = ?', args: [hashToken(token)] });
  }
  store.delete(ADMIN_COOKIE);
}

/** The signed-in admin, or null. Every admin page and action checks this itself. */
export async function getAdmin(): Promise<AdminUser | null> {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token) return null;
  const c = await db();
  const r = await c.execute({
    sql: `SELECT s.admin_id, s.owner_key, a.name, a.email FROM admin_sessions s LEFT JOIN admins a ON a.id = s.admin_id
          WHERE s.token_hash = ? AND s.expires_at > ?`,
    args: [hashToken(token), new Date().toISOString()],
  });
  const row = r.rows[0];
  if (!row) return null;
  if (row.admin_id === null) {
    const creds = adminCredentials(), key = ownerKey();
    if (!creds || !key || row.owner_key !== key) return null; // the main login has changed since
    return { id: null, name: creds.username, email: null, isOwner: true };
  }
  if (row.name === null) return null; // that admin has been removed
  return { id: Number(row.admin_id), name: String(row.name), email: String(row.email), isOwner: false };
}

export const isAdmin = async () => (await getAdmin()) !== null;

/** After an admin changes their password: sign them out everywhere else. */
export async function endOtherAdminSessions(adminId: number) {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value ?? '';
  const c = await db();
  await c.execute({ sql: 'DELETE FROM admin_sessions WHERE admin_id = ? AND token_hash != ?', args: [adminId, hashToken(token)] });
}

/** a stored hash to check against when no admin has that email, so the reply takes the same time */
let dummy: Promise<string> | null = null;
export const dummyPasswordHash = () => (dummy ??= hashPassword('not-a-real-password'));
