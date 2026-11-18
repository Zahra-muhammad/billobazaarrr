import 'server-only';
import nodemailer from 'nodemailer';

/**
 * Sending email from the admin panel, through any SMTP service. Set in .env.local (or the host's
 * settings online):
 *   SMTP_HOST, SMTP_PORT (465 or 587), SMTP_USER, SMTP_PASS, MAIL_FROM (e.g. "Billo Bazaar <hello@billobazaar.pk>")
 * Gmail, for example: SMTP_HOST=smtp.gmail.com, SMTP_PORT=465, SMTP_USER=you@gmail.com and an
 * App Password (Google account > Security > App passwords) as SMTP_PASS.
 * Until these are set, nothing is sent: the admin panel saves the message and says so.
 */

export type Recipient = { name: string; email: string };
export type SendResult = { configured: boolean; delivered: number; failed: number; error?: string };

export function mailConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]!);
const firstName = (name: string) => name.trim().split(/\s+/)[0] || 'there';
const personalise = (text: string, r: Recipient) => text.replace(/\{name\}/gi, firstName(r.name));

/** the message as a simple branded HTML email (and plain text alongside it) */
function html(body: string) {
  const paras = escapeHtml(body).split(/\n{2,}/).map((p) => `<p style="margin:0 0 16px">${p.replace(/\n/g, '<br>')}</p>`).join('');
  return `<div style="background:#EFEEEA;padding:32px 16px;font-family:Inter,Arial,sans-serif;color:#3B0A0A">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;padding:32px 28px;font-size:16px;line-height:1.6">
    <p style="margin:0 0 24px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;font-size:12px;color:#8C1C13">Billo Bazaar</p>
    ${paras}
  </div>
  <p style="max-width:560px;margin:16px auto 0;font-size:12px;color:#6B4A45;text-align:center">You're getting this because you have an account with Billo Bazaar.</p>
</div>`;
}

/** Sends the message to each person separately (no one sees anyone else's address). */
export async function sendToPeople(people: Recipient[], subject: string, body: string): Promise<SendResult> {
  if (!mailConfigured()) return { configured: false, delivered: 0, failed: 0 };
  const port = Number(process.env.SMTP_PORT || 465);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  let delivered = 0, failed = 0, error: string | undefined;
  // a few at a time, so a long list doesn't trip the service's limits
  const queue = [...people];
  const worker = async () => {
    for (let r = queue.shift(); r; r = queue.shift()) {
      const text = personalise(body, r);
      try {
        await transport.sendMail({ from, to: { name: r.name, address: r.email }, subject: personalise(subject, r), text, html: html(text) });
        delivered++;
      } catch (e) {
        failed++;
        error ??= e instanceof Error ? e.message : String(e);
      }
    }
  };
  await Promise.all([worker(), worker(), worker()]);
  transport.close();
  return { configured: true, delivered, failed, error };
}
