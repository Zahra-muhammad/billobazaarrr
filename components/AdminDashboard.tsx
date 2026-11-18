'use client';

import { startTransition, useActionState, useEffect, useMemo, useState, type FormEvent } from 'react';
import { addAdmin, adminSignOut, changeAdminPassword, removeAdmin, sendEmail, type SendState, type TeamState } from '@/app/actions/admin';

type Role = 'student' | 'manufacturer' | 'partner';
export type AdminData = {
  people: { id: number; name: string; email: string; role: Role; city: string; joined: string; lastSeen: string | null; logins: number }[];
  activity: { kind: 'signup' | 'login'; at: string; name: string; role: Role }[];
  emails: { audience: string; subject: string; status: string; recipients: number; delivered: number; note: string; by: string; at: string }[];
  activeThisWeek: number;
  mail: { on: boolean; via: string };
  /** who is signed in: the main admin (from the site's settings) or an admin added in the panel */
  me: { name: string; isOwner: boolean };
  ownerName: string;
  admins: { id: number; name: string; email: string; addedBy: string; added: string; lastSeen: string | null }[];
};

const ROLE_LABEL: Record<Role, string> = { student: 'Student', manufacturer: 'Manufacturer', partner: 'Partner' };
const GROUP_LABEL: Record<Role, string> = { student: 'Students', manufacturer: 'Manufacturers', partner: 'Partners' };
const ROLES: Role[] = ['student', 'manufacturer', 'partner'];

/** database times are UTC "YYYY-MM-DD HH:MM:SS" */
const parse = (ts: string) => new Date(ts.includes('T') ? ts : `${ts.replace(' ', 'T')}Z`);
function ago(ts: string, now: number) {
  const s = Math.max(0, (now - parse(ts).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 7 * 86400) return `${Math.floor(s / 86400)} d ago`;
  return parse(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
/** a time, shown relative ("5 min ago") with the full date on hover; worked out in the browser */
function When({ ts, now }: { ts: string; now: number }) {
  return (
    <time dateTime={parse(ts).toISOString()} title={parse(ts).toLocaleString()} suppressHydrationWarning>
      {ago(ts, now)}
    </time>
  );
}

/** The admin panel (see app/admin/page.tsx, which loads the data and checks you're the admin). */
export default function AdminDashboard({ data }: { data: AdminData }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = window.setInterval(() => setNow(Date.now()), 30000); return () => window.clearInterval(t); }, []);

  const [tab, setTab] = useState<Role | 'all'>('all');
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [audience, setAudience] = useState<string>('everyone');
  const [state, action, pending] = useActionState<SendState, FormData>(sendEmail, undefined);

  const count = (r: Role) => data.people.filter((p) => p.role === r).length;
  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return data.people.filter((p) => (tab === 'all' || p.role === tab) && (!needle || `${p.name} ${p.email} ${p.city}`.toLowerCase().includes(needle)));
  }, [data.people, tab, q]);

  // ticking people points the email at them; unticking everyone points it back at everyone
  const pick = (n: Set<number>) => { setPicked(n); setAudience(n.size ? 'selected' : 'everyone'); };
  const toggle = (id: number) => {
    const n = new Set(picked);
    if (n.has(id)) n.delete(id); else n.add(id);
    pick(n);
  };
  const allShownPicked = shown.length > 0 && shown.every((p) => picked.has(p.id));
  const toggleAll = () => {
    const n = new Set(picked);
    shown.forEach((p) => (allShownPicked ? n.delete(p.id) : n.add(p.id)));
    pick(n);
  };

  // the subject and message are kept here, so a failed send never loses what was written;
  // they clear only once an email has gone out
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [lastState, setLastState] = useState<SendState>(undefined);
  if (state !== lastState) {
    setLastState(state);
    if (state?.ok) { setSubject(''); setBody(''); }
  }

  const audienceSize = audience === 'selected' ? picked.size : audience === 'everyone' ? data.people.length : count(audience as Role);
  const confirmSend = (e: FormEvent<HTMLFormElement>) => {
    const verb = data.mail.on ? 'Send this email to' : 'Save this email for';
    if (!window.confirm(`${verb} ${audienceSize} ${audienceSize === 1 ? 'person' : 'people'}?`)) e.preventDefault();
  };

  return (
    <div className="admin adm-dash">
      <header className="adm-top">
        <p className="adm-brand">Billo Bazaar · Admin</p>
        <nav>
          <span className="adm-me">Signed in as <b>{data.me.name}</b>{data.me.isOwner ? ' (main admin)' : ''}</span>
          <a href="/">View site</a>
          <form action={adminSignOut}><button type="submit">Sign out</button></form>
        </nav>
      </header>

      <section className="adm-stats" aria-label="Totals">
        {ROLES.map((r) => (
          <button key={r} type="button" className={tab === r ? 'adm-stat on' : 'adm-stat'} onClick={() => setTab(r)}>
            <b>{count(r)}</b><span>{GROUP_LABEL[r]}</span>
          </button>
        ))}
        <button type="button" className={tab === 'all' ? 'adm-stat on' : 'adm-stat'} onClick={() => setTab('all')}>
          <b>{data.people.length}</b><span>Everyone</span>
        </button>
        <div className="adm-stat"><b>{data.activeThisWeek}</b><span>Signed in this week</span></div>
      </section>

      <div className="adm-grid">
        <div className="adm-main">
        {/* everyone who has signed up */}
        <section className="adm-panel adm-people" aria-labelledby="admPeople">
          <div className="adm-head">
            <h2 id="admPeople">People</h2>
            <div className="adm-tabs" role="tablist" aria-label="Show">
              {(['all', ...ROLES] as const).map((t) => (
                <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? 'on' : undefined} onClick={() => setTab(t)}>
                  {t === 'all' ? 'All' : GROUP_LABEL[t]}
                </button>
              ))}
            </div>
            <input className="adm-search" type="search" placeholder="Search name, email or city" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search people" />
          </div>
          {shown.length === 0 ? (
            <p className="adm-empty">{data.people.length ? 'No one matches that.' : 'No one has signed up yet. When people make an account, they’ll appear here.'}</p>
          ) : (
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" checked={allShownPicked} onChange={toggleAll} aria-label="Tick everyone shown" /></th>
                    <th>Name</th><th>Type</th><th>City</th><th>Joined</th><th>Last signed in</th><th>Sign-ins</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((p) => (
                    <tr key={p.id} className={picked.has(p.id) ? 'on' : undefined}>
                      <td><input type="checkbox" checked={picked.has(p.id)} onChange={() => toggle(p.id)} aria-label={`Tick ${p.name}`} /></td>
                      <td><b>{p.name}</b><a href={`mailto:${p.email}`}>{p.email}</a></td>
                      <td><span className={`adm-role ${p.role}`}>{ROLE_LABEL[p.role]}</span></td>
                      <td>{p.city || '—'}</td>
                      <td><When ts={p.joined} now={now} /></td>
                      <td>{p.lastSeen ? <When ts={p.lastSeen} now={now} /> : '—'}</td>
                      <td className="num">{p.logins}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <AdminTeam data={data} now={now} />
        </div>

        <div className="adm-side">
          {/* write to a group, or the people ticked in the list */}
          <section className="adm-panel" aria-labelledby="admMail">
            <h2 id="admMail">Send an email</h2>
            <p className={data.mail.on ? 'adm-mailstate on' : 'adm-mailstate'}>
              {data.mail.on ? `Email sending is on (${data.mail.via}).` : 'Email sending isn’t set up yet: emails will be saved here, not sent. See SETUP in .env.example.'}
            </p>
            <form action={action} onSubmit={confirmSend} className="adm-compose">
              <label className="adm-fld">
                <span>To</span>
                <select name="audience" value={audience} onChange={(e) => setAudience(e.target.value)}>
                  <option value="selected" disabled={!picked.size}>People ticked in the list ({picked.size})</option>
                  {ROLES.map((r) => <option key={r} value={r}>All {GROUP_LABEL[r].toLowerCase()} ({count(r)})</option>)}
                  <option value="everyone">Everyone ({data.people.length})</option>
                </select>
              </label>
              {audience === 'selected' && [...picked].map((id) => <input key={id} type="hidden" name="ids" value={id} />)}
              <label className="adm-fld">
                <span>Subject</span>
                <input name="subject" required maxLength={200} value={subject} onChange={(e) => setSubject(e.target.value)} />
              </label>
              <label className="adm-fld">
                <span>Message</span>
                <textarea name="body" rows={8} required maxLength={20000} placeholder={'Hi {name},\n\n…'} value={body} onChange={(e) => setBody(e.target.value)} />
              </label>
              <p className="adm-hint">Write <code>{'{name}'}</code> and each person sees their own first name.</p>
              {state && <p className={state.ok ? 'adm-ok' : 'adm-err'} role="status">{state.message}</p>}
              <button type="submit" className="adm-btn" disabled={pending || audienceSize === 0}>
                {pending ? 'Sending…' : `${data.mail.on ? 'Send' : 'Save'} to ${audienceSize} ${audienceSize === 1 ? 'person' : 'people'}`}
              </button>
            </form>
          </section>

          {/* who came in, newest first */}
          <section className="adm-panel" aria-labelledby="admAct">
            <h2 id="admAct">Recent sign-ins</h2>
            {data.activity.length === 0 ? <p className="adm-empty">Nothing yet.</p> : (
              <ul className="adm-list">
                {data.activity.map((a, i) => (
                  <li key={i}>
                    <span><b>{a.name}</b> <span className={`adm-role ${a.role}`}>{ROLE_LABEL[a.role]}</span> {a.kind === 'signup' ? 'made an account' : 'signed in'}</span>
                    <When ts={a.at} now={now} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* what was sent */}
          <section className="adm-panel" aria-labelledby="admSent">
            <h2 id="admSent">Emails</h2>
            {data.emails.length === 0 ? <p className="adm-empty">No emails yet.</p> : (
              <ul className="adm-list">
                {data.emails.map((m, i) => (
                  <li key={i} title={m.note || undefined}>
                    <span><b>{m.subject}</b> to {m.audience}{m.by ? `, by ${m.by}` : ''} · <span className={`adm-status ${m.status.replace(' ', '-')}`}>{m.status}</span></span>
                    <When ts={m.at} now={now} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

/** a strong random password to give a new admin (they can change it after signing in) */
function makePassword() {
  const abc = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint32Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => abc[n % abc.length]).join('').replace(/(.{4})(?!$)/g, '$1-');
}

/**
 * Who can sign in to this panel. The main admin (the login in the site's settings) adds and
 * removes admins; an added admin signs in with their email and can change their own password.
 */
function AdminTeam({ data, now }: { data: AdminData; now: number }) {
  const owner = data.me.isOwner;
  const [addState, addAction, adding] = useActionState<TeamState, FormData>(addAdmin, undefined);
  const [pwState, pwAction, changing] = useActionState<TeamState, FormData>(changeAdminPassword, undefined);
  // the new admin's details are kept here, so a mistake doesn't wipe them; cleared once added
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lastAdd, setLastAdd] = useState<TeamState>(undefined);
  if (addState !== lastAdd) {
    setLastAdd(addState);
    if (addState?.ok) { setName(''); setEmail(''); }
  }
  // submitted by hand: React's own form reset would wipe what was typed after every try
  const submit = (action: (fd: FormData) => void) => (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };
  const confirmRemove = (who: string) => (e: FormEvent<HTMLFormElement>) => {
    if (!window.confirm(`Remove ${who} as an admin? They'll be signed out straight away.`)) e.preventDefault();
  };

  return (
    <section className="adm-panel adm-team" aria-labelledby="admTeam">
      <h2 id="admTeam">Admins</h2>
      <ul className="adm-list">
        <li>
          <span><b>{data.ownerName || 'Main admin'}</b> <span className="adm-tag">Main admin</span></span>
          <span className="adm-quiet">login from the site’s settings</span>
        </li>
        {data.admins.map((a) => (
          <li key={a.id}>
            <span><b>{a.name}</b> <span className="adm-quiet">{a.email}</span></span>
            <span className="adm-row-end">
              <span className="adm-quiet">{a.lastSeen ? <>signed in <When ts={a.lastSeen} now={now} /></> : 'hasn’t signed in yet'}</span>
              {owner && (
                <form action={removeAdmin} onSubmit={confirmRemove(a.name)}>
                  <input type="hidden" name="id" value={a.id} />
                  <button type="submit" className="adm-linkbtn">Remove</button>
                </form>
              )}
            </span>
          </li>
        ))}
      </ul>

      {owner ? (
        <form onSubmit={submit(addAction)} className="adm-compose adm-addadmin" noValidate>
          <h3>Add an admin</h3>
          <p className="adm-hint">They sign in at <code>/admin/signin</code> with their email and this password, and can see everyone and send emails. Only you can add or remove admins.</p>
          <div className="adm-two">
            <label className="adm-fld"><span>Name</span><input name="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={80} /></label>
            <label className="adm-fld"><span>Email</span><input name="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={254} /></label>
          </div>
          <label className="adm-fld">
            <span>Password (at least 10 characters)</span>
            <span className="adm-pw">
              <input name="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={10} maxLength={200} autoComplete="new-password" spellCheck={false} />
              <button type="button" className="adm-linkbtn" onClick={() => setPassword(makePassword())}>Make a password</button>
            </span>
          </label>
          {addState && <p className={addState.ok ? 'adm-ok' : 'adm-err'} role="status">{addState.message}</p>}
          <button type="submit" className="adm-btn" disabled={adding}>{adding ? 'Adding…' : 'Add admin'}</button>
        </form>
      ) : (
        <form onSubmit={submit(pwAction)} className="adm-compose adm-addadmin" noValidate>
          <h3>Change my password</h3>
          <label className="adm-fld"><span>Current password</span><input name="current" type="password" autoComplete="current-password" required /></label>
          <div className="adm-two">
            <label className="adm-fld"><span>New password</span><input name="next" type="password" autoComplete="new-password" required minLength={10} /></label>
            <label className="adm-fld"><span>New password again</span><input name="again" type="password" autoComplete="new-password" required minLength={10} /></label>
          </div>
          {pwState && <p className={pwState.ok ? 'adm-ok' : 'adm-err'} role="status">{pwState.message}</p>}
          <button type="submit" className="adm-btn" disabled={changing}>{changing ? 'Saving…' : 'Change password'}</button>
        </form>
      )}
    </section>
  );
}
