import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { createClient, type Client } from '@libsql/client';

/**
 * The site's database. On this computer it is a file, data/billobazaar.db (kept out of git: it
 * holds people's details). Online, set TURSO_DATABASE_URL (and TURSO_AUTH_TOKEN) to a Turso
 * database and the same code uses that instead. The tables are created on first use.
 */

export type Role = 'student' | 'manufacturer' | 'partner';
export const ROLES: Role[] = ['student', 'manufacturer', 'partner'];

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    role TEXT NOT NULL CHECK (role IN ('student', 'manufacturer', 'partner')),
    city TEXT,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    last_login_at TEXT,
    login_count INTEGER NOT NULL DEFAULT 0
  )`,
  // every sign-up and sign-in, so the admin panel can show who came in and when
  `CREATE TABLE IF NOT EXISTS logins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('signup', 'login')),
    at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE INDEX IF NOT EXISTS logins_at ON logins (at DESC)`,
  // signed-in people and the signed-in admin: only a hash of each session token is stored
  `CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    is_admin INTEGER NOT NULL DEFAULT 0,
    expires_at TEXT NOT NULL
  )`,
  // emails sent (or saved, while sending isn't set up) from the admin panel
  `CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    audience TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    recipients INTEGER NOT NULL,
    delivered INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK (status IN ('sent', 'partly sent', 'not sent', 'saved')),
    note TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
];

let client: Client | null = null;
let ready: Promise<void> | null = null;

function connect(): Client {
  if (client) return client;
  const url = process.env.TURSO_DATABASE_URL;
  if (url) {
    client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  } else if (process.env.VERCEL) {
    // online there's no lasting disk for a database file, so say plainly what's missing
    throw new Error('No database for the live site: connect a Turso database (Vercel > Storage) so TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are set, then redeploy.');
  } else {
    const dir = path.join(process.cwd(), 'data');
    fs.mkdirSync(dir, { recursive: true });
    client = createClient({ url: `file:${path.join(dir, 'billobazaar.db').replace(/\\/g, '/')}` });
  }
  return client;
}

/** The database, with its tables in place. */
export async function db(): Promise<Client> {
  const c = connect();
  if (!ready) {
    ready = (async () => {
      await c.execute('PRAGMA foreign_keys = ON');
      for (const sql of SCHEMA) await c.execute(sql);
    })().catch((e) => { ready = null; throw e; });
  }
  await ready;
  return c;
}
