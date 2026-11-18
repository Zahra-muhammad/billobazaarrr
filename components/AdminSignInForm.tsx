'use client';

import { startTransition, useActionState, type FormEvent } from 'react';
import { adminSignIn, type AdminSignInState } from '@/app/actions/admin';

/** The admin sign-in card: username and password from the site's settings. */
export default function AdminSignInForm({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState<AdminSignInState, FormData>(adminSignIn, undefined);
  // submitted by hand, so a wrong password doesn't also wipe the username (React resets <form action> forms)
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };
  return (
    <div className="admin adm-signin">
      <form onSubmit={submit} className="adm-card" noValidate>
        <p className="adm-brand">Billo Bazaar · Admin</p>
        <h1>Admin login</h1>
        <p className="adm-muted">Only for the site’s admin.</p>
        {!configured && (
          <p className="adm-warn" role="status">
            The admin login isn’t set up yet. Add <code>ADMIN_USERNAME</code> and <code>ADMIN_PASSWORD</code> to the site’s settings (<code>.env.local</code> on this computer).
          </p>
        )}
        <label className="adm-fld">
          <span>Username</span>
          <input name="username" autoComplete="username" required />
        </label>
        <label className="adm-fld">
          <span>Password</span>
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        {state?.error && <p className="adm-err" role="alert">{state.error}</p>}
        <button type="submit" className="adm-btn" disabled={pending || !configured}>{pending ? 'Signing in…' : 'Sign in'}</button>
        <a className="adm-back" href="/">← Back to the site</a>
      </form>
    </div>
  );
}
