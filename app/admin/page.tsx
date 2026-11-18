import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { isAdmin } from '@/lib/auth';
import { db, type Role } from '@/lib/db';
import { mailConfigured } from '@/lib/mail';
import AdminDashboard, { type AdminData } from '@/components/AdminDashboard';

export const metadata: Metadata = { title: 'Admin', robots: { index: false, follow: false } };

/** The admin panel: everyone who has signed up (by student / manufacturer / partner), who has
 *  been signing in, and emailing them. Only for the signed-in admin. */
export default async function AdminPage() {
  if (!(await isAdmin())) redirect('/admin/signin');
  const c = await db();
  const [users, logins, emails, week] = await Promise.all([
    c.execute('SELECT id, name, email, role, city, created_at, last_login_at, login_count FROM users ORDER BY created_at DESC'),
    c.execute(`SELECT l.kind, l.at, u.name, u.role FROM logins l JOIN users u ON u.id = l.user_id ORDER BY l.at DESC LIMIT 40`),
    c.execute('SELECT audience, subject, status, recipients, delivered, note, created_at FROM emails ORDER BY created_at DESC LIMIT 20'),
    c.execute(`SELECT COUNT(DISTINCT user_id) AS n FROM logins WHERE at > datetime('now', '-7 days')`),
  ]);

  const data: AdminData = {
    people: users.rows.map((r) => ({
      id: Number(r.id), name: String(r.name), email: String(r.email), role: r.role as Role, city: r.city ? String(r.city) : '',
      joined: String(r.created_at), lastSeen: r.last_login_at ? String(r.last_login_at) : null, logins: Number(r.login_count),
    })),
    activity: logins.rows.map((r) => ({ kind: r.kind as 'signup' | 'login', at: String(r.at), name: String(r.name), role: r.role as Role })),
    emails: emails.rows.map((r) => ({
      audience: String(r.audience), subject: String(r.subject), status: String(r.status), recipients: Number(r.recipients),
      delivered: Number(r.delivered), note: r.note ? String(r.note) : '', at: String(r.created_at),
    })),
    activeThisWeek: Number(week.rows[0]?.n ?? 0),
    mail: mailConfigured() ? { on: true, via: process.env.SMTP_HOST ?? '' } : { on: false, via: '' },
  };
  return <AdminDashboard data={data} />;
}
