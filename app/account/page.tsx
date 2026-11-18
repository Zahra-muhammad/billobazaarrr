import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { logout } from '@/app/actions/auth';
import { site } from '@/data/site';
import IntroOrnament from '@/components/IntroOrnament';
import TransitionLink from '@/components/TransitionLink';
import { Wordmark } from '@/components/LogoSymbol';

export const metadata: Metadata = { title: site.auth.account, robots: { index: false, follow: false } };

/**
 * Your account, after signing up or logging in. Nothing has launched yet, so for now it just
 * says "Coming soon." with a way back. Only for signed-in people: anyone else goes to log in.
 */
export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const a = site.auth.accountPage;
  const first = user.name.trim().split(/\s+/)[0];

  return (
    <div className="authpage account">
      <IntroOrnament />
      <TransitionLink className="pg-logo" href="/" aria-label={`${site.name} home`}>
        <Wordmark aria-hidden="true" />
      </TransitionLink>
      <div className="acc-in">
        <p className="bb-k">{a.kicker}</p>
        <p className="acc-hi">
          {a.hello}, {first} <span>· {site.auth.roles[user.role]}</span>
        </p>
        <h1 aria-label={a.heading.join(' ')}>
          <span className="l">{a.heading[0]}</span> <em>{a.heading[1]}</em>
        </h1>
        <TransitionLink className="dpill" href="/">
          <span>{a.back}</span>
          <i aria-hidden="true"><b>←</b><b>←</b></i>
        </TransitionLink>
        <form action={logout}>
          <button type="submit" className="acc-out">{a.logout}</button>
        </form>
      </div>
    </div>
  );
}
