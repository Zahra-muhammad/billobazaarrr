'use client';

import { startTransition, useActionState, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { login, signup, type AuthState } from '@/app/actions/auth';
import { site } from '@/data/site';
import IntroOrnament from './IntroOrnament';
import TransitionLink from './TransitionLink';
import { Wordmark } from './LogoSymbol';

type Role = keyof typeof site.auth.roles;

/**
 * The sign-up and log-in pages: a centred card over the site's line-art frame. Sign up asks for
 * a name, email, password, whether you're a student, manufacturer or partner, and (optionally)
 * your city; /signup?as=student (or manufacturer, partner) picks that choice for you.
 * On success the server signs you in and sends you to your account.
 */
export default function AuthForm({ mode }: { mode: 'signup' | 'login' }) {
  const isSignup = mode === 'signup';
  const copy = isSignup ? site.auth.signupPage : site.auth.loginPage;
  const [state, action, pending] = useActionState<AuthState, FormData>(isSignup ? signup : login, undefined);
  const f = state?.fields ?? {};
  const [role, setRole] = useState<string>('');
  const router = useRouter();

  // already signed in (say, clicking "Start with your sketch" again): straight to the account
  useEffect(() => {
    let live = true;
    fetch('/api/me', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d) => { if (live && d.user) router.replace('/account'); })
      .catch(() => {});
    return () => { live = false; };
  }, [router]);

  // submitted by hand rather than through <form action>: React resets a form after its action
  // runs, which would wipe what was typed (and un-tick the role) whenever there's an error
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => action(fd));
  };

  // keep the choice after an error; or take it from the link (?as=student)
  useEffect(() => {
    if (f.role) { setRole(f.role); return; }
    const as = new URLSearchParams(window.location.search).get('as');
    if (as && as in site.auth.roles) setRole(as);
  }, [f.role]);

  return (
    <div className="authpage">
      <IntroOrnament />
      <TransitionLink className="pg-logo" href="/" aria-label={`${site.name} home`}>
        <Wordmark aria-hidden="true" />
      </TransitionLink>
      <div className="auth-card">
        <p className="bb-k">{copy.kicker}</p>
        <h1 aria-label={copy.heading.join(' ')}>
          <span className="l">{copy.heading[0]}</span> <em>{copy.heading[1]}</em>
        </h1>
        <form onSubmit={submit} className="auth-form" noValidate>
          {isSignup && (
            <label className="fld">
              <span>Your name</span>
              <input name="name" autoComplete="name" defaultValue={f.name} required maxLength={80} />
            </label>
          )}
          <label className="fld">
            <span>Email</span>
            <input name="email" type="email" autoComplete="email" defaultValue={f.email} required maxLength={254} />
          </label>
          <label className="fld">
            <span>Password{isSignup && <i> (at least 8 characters)</i>}</span>
            <input name="password" type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} required minLength={isSignup ? 8 : undefined} />
          </label>
          {isSignup && (
            <>
              <fieldset className="roles">
                <legend>I’m a</legend>
                {(Object.keys(site.auth.roles) as Role[]).map((r) => (
                  <label key={r} className={role === r ? 'on' : undefined}>
                    <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} required />
                    <span>{site.auth.roles[r]}</span>
                  </label>
                ))}
              </fieldset>
              <label className="fld">
                <span>City <i>(optional)</i></span>
                <input name="city" autoComplete="address-level2" defaultValue={f.city} maxLength={80} />
              </label>
            </>
          )}
          {state?.error && <p className="auth-err" role="alert">{state.error}</p>}
          <button type="submit" className="dpill" disabled={pending}>
            <span>{pending ? 'One moment…' : copy.submit}</span>
            <i aria-hidden="true"><b>→</b><b>→</b></i>
          </button>
        </form>
        <p className="auth-switch">
          {copy.switchText}{' '}
          <TransitionLink href={isSignup ? '/login' : '/signup'}>{copy.switchLink}</TransitionLink>
        </p>
      </div>
    </div>
  );
}
