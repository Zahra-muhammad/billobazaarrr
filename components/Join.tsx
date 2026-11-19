'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { registerEntrance } from '@/lib/hero';
import { site } from '@/data/site';
import { Wordmark } from './LogoSymbol';
import TransitionLink from './TransitionLink';

type Who = keyof typeof site.auth.roles;

/** /join#students, #manufacturers (or the older #makers) and #partners pick that choice for sign up. */
const FROM_HASH: Record<string, Who> = {
  students: 'student', student: 'student',
  manufacturers: 'manufacturer', manufacturer: 'manufacturer', makers: 'manufacturer', maker: 'manufacturer',
  partners: 'partner', partner: 'partner',
};
const whoFromHash = () => FROM_HASH[window.location.hash.slice(1).toLowerCase()];

/**
 * The join page. First screen: "Pick your way in." and three tall photo panels (Student,
 * Manufacturer, Partner) over a dark, maroon-washed sewing video. Hovering one widens it, lights
 * its photo, turns its word heavy and pink, and shows a frosted box with what it's for; clicking
 * it opens sign up with that choice picked. Then "Say salaam.": the way in, Sign up or Log in.
 */
export default function Join() {
  const j = site.join;
  const f = j.form;
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [who, setWho] = useState<Who | null>(null);

  // the background video: started by hand too (some browsers skip autoplay until `muted` is set
  // as a property), and kept still for people who prefer reduced motion
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    if (prefersReducedMotion()) v.pause();
    else v.play().catch(() => {});
  }, []);

  // a link from the home page (/join#students...) picks that choice for the Sign up button
  useEffect(() => {
    const pick = () => { const w = whoFromHash(); if (w) setWho(w); };
    pick();
    window.addEventListener('hashchange', pick);
    return () => window.removeEventListener('hashchange', pick);
  }, []);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    // the first screen: the heading rises line by line, the panels rise in one after another.
    // Registered with lib/hero, so under the page-change cover it waits and plays as it lifts.
    const tl = gsap.timeline({ delay: 0.15 });
    tl.from('.jn-t .ln > span', { yPercent: 110, duration: 1.6, stagger: 0.14, ease: 'expo.out' }, 0)
      .from('.jp', { clipPath: 'inset(100% 0% 0% 0% round 14px)', duration: 1.8, stagger: 0.12, ease: 'expo.out', clearProps: 'clipPath' }, 0.15)
      .from('.jp b', { yPercent: 60, opacity: 0, duration: 1.6, stagger: 0.12, ease: 'expo.out' }, 0.6);
    const unregister = registerEntrance({ hide: () => tl.pause(0), reveal: () => tl.restart() });
    // "Say salaam." rises line by line as it scrolls into view
    gsap.from('.jn-ml h2 .ln > span', {
      yPercent: 108, duration: 1.6, stagger: 0.12, ease: 'expo.out',
      scrollTrigger: { trigger: '.jn-ml h2', start: 'top 85%', toggleActions: 'play none none reverse' },
    });
    return unregister;
  }, { scope: ref });

  const signupHref = who ? `/signup?as=${who}` : '/signup';

  return (
    <div className="join" ref={ref}>
      <section className="jn-hero2" aria-labelledby="jnH">
        {/* the sewing video, quietly behind everything: blurred a little and washed deep maroon so
            the three panels stay the brightest thing on the screen */}
        <div className="washbg" aria-hidden="true">
          <video ref={videoRef} muted loop playsInline autoPlay preload="auto">
            <source src={j.videoSrc} type="video/mp4" />
          </video>
        </div>
        <TransitionLink className="pg-logo" href="/" aria-label={`${site.name} home`}>
          <Wordmark aria-hidden="true" />
        </TransitionLink>
        <div className="jn-hd">
          <p className="bb-k">{j.kicker}</p>
          <h1 id="jnH" className="jn-t" aria-label={j.heading.join(' ')}>
            <span className="ln" aria-hidden="true"><span>{j.heading[0]}</span></span>
            <span className="ln b" aria-hidden="true"><span>{j.heading[1]}</span></span>
          </h1>
        </div>
        <nav className="jn-panels" aria-label={j.panelsLabel}>
          {j.panels.map((p) => (
            <TransitionLink key={p.who} className="jp" href={`/signup?as=${p.who}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.img} alt="" style={{ objectPosition: p.pos }} />
              <span className="jp-n" aria-hidden="true">{p.n}</span>
              <span className="jp-b">
                <b>{p.word}</b>
                <span className="jp-d">{p.text}</span>
                <i aria-hidden="true">→</i>
              </span>
            </TransitionLink>
          ))}
        </nav>
      </section>

      {/* the way in: make an account, or log in */}
      <section className="jn-ml jn-go" id="apply" aria-labelledby="mlH">
        <div className="jn-ml-head">
          <p className="bb-k">{f.kicker}</p>
          <h2 id="mlH" aria-label={f.heading.join(' ')}>
            <span className="ln" aria-hidden="true"><span>{f.heading[0]}</span></span>
            <span className="ln" aria-hidden="true"><span><em>{f.heading[1]}</em></span></span>
          </h2>
        </div>
        <div className="jn-go-in">
          <p className="jn-go-lead">{f.lead}</p>
          <div className="jn-go-row">
            <TransitionLink className="dpill" href={signupHref}>
              <span>{f.signup}</span>
              <i aria-hidden="true"><b>→</b><b>→</b></i>
            </TransitionLink>
            <p className="jn-go-login">
              {f.loginText} <TransitionLink href="/login">{f.login}</TransitionLink>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
