'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP, EVENTS } from '@/lib/gsap';
import { site } from '@/data/site';
import { Wordmark } from './LogoSymbol';
import TransitionLink from './TransitionLink';

export default function Footer() {
  const ref = useRef<HTMLElement>(null);
  const f = site.footer;

  useGSAP(() => {
    // the giant wordmark rises in when the footer reaches 80% of the viewport
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.giant svg', {
        yPercent: 35, duration: 2, ease: 'expo.out',
        scrollTrigger: { trigger: ref.current, start: 'top 80%' },
      });
    });
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener(EVENTS.ready, refresh);
    return () => window.removeEventListener(EVENTS.ready, refresh);
  }, { scope: ref });

  return (
    <footer ref={ref}>
      {/* the big faded wordmark sits behind all the footer content, resting on the bottom line */}
      <div className="fmain">
        <div className="giant" aria-hidden="true">
          <Wordmark preserveAspectRatio="xMinYMax meet" />
        </div>
        <div className="wrap fgrid">
          <div className="fl">
            <p className="mono">{f.start}</p>
            <h2 className="fh">
              {f.title} <em>{f.em}</em>
            </h2>
            <a className="fcta" href={f.cta.href}>
              {f.cta.label}{' '}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
          </div>
          <div className="fc">
            <p className="mono">{f.whatWeDo.label}</p>
            <ul>
              {f.whatWeDo.items.map((item) => (
                <li key={item}>
                  <p>{item}</p>
                </li>
              ))}
            </ul>
          </div>
          <nav className="fc" aria-label={site.name}>
            <p className="mono">{f.bazaar.label}</p>
            <ul>
              {f.bazaar.links.map((l) => (
                <li key={l.label}>
                  {l.href.startsWith('/') ? <TransitionLink href={l.href}>{l.label}</TransitionLink> : <a href={l.href}>{l.label}</a>}
                </li>
              ))}
            </ul>
          </nav>
          <div className="fc">
            <p className="mono">{f.findUs}</p>
            <p>
              {site.contact.address}
              <br />
              {site.contact.country}
            </p>
            <p>
              {site.contact.email}
              <br />
              WhatsApp {site.contact.whatsapp}
            </p>
            <p>
              {site.social[0].label} &nbsp;·&nbsp; {site.social[1].label}
              <br />
              {site.social[2].label}
            </p>
            <p className="soft">{site.contact.hours}</p>
          </div>
        </div>
      </div>
      <div className="fbar">
        <span>{f.copyright}</span>
        <div className="fbar-r">
          <button type="button" onClick={() => window.dispatchEvent(new Event(EVENTS.replay))}>
            {f.replay}
          </button>
          <span className="mono">{f.tagline}</span>
        </div>
      </div>
    </footer>
  );
}
