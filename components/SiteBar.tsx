'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { site } from '@/data/site';
import TransitionLink from './TransitionLink';

/** Pages with their own way in or out, where the bar would only repeat itself. On the home page
 *  "Start with your sketch" is the way to sign up. */
const HIDDEN = ['/', '/login', '/signup', '/account', '/admin'];

/**
 * Top right of every page but home: "Log in" and a "Sign up" pill, or "My account" once someone is signed
 * in (asked from /api/me, so the pages themselves stay static). It sits at the top of the screen
 * and fades away as soon as you scroll; the MENU pill takes over from there. The outer element is
 * faded in by the intro (Loader), the inner one by scrolling.
 */
export default function SiteBar() {
  const pathname = usePathname();
  const [user, setUser] = useState<{ name: string } | null | undefined>(undefined);
  const [away, setAway] = useState(false);
  const hidden = HIDDEN.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // ask again on every page change (after logging in or out, the bar should know)
  useEffect(() => {
    if (hidden) return;
    let live = true;
    fetch('/api/me', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((d) => { if (live) setUser(d.user ?? null); })
      .catch(() => { if (live) setUser(null); });
    return () => { live = false; };
  }, [pathname, hidden]);

  useEffect(() => {
    const onScroll = () => setAway(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (hidden) return null;
  const a = site.auth;
  return (
    <div className="sitebar">
      <nav className={`sb-in${away ? ' away' : ''}${user === undefined ? ' wait' : ''}`} aria-label="Account">
        {user ? (
          <TransitionLink className="sb-pill" href="/account">{a.account}</TransitionLink>
        ) : (
          <>
            <TransitionLink className="sb-link" href="/login">{a.login}</TransitionLink>
            <TransitionLink className="sb-pill" href="/signup">{a.signup}</TransitionLink>
          </>
        )}
      </nav>
    </div>
  );
}
