'use client';

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type MouseEvent, type ReactNode } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { registerEntrance } from '@/lib/hero';
import { scrollToId } from '@/lib/scroll';
import { site } from '@/data/site';
import { Wordmark } from './LogoSymbol';
import TransitionLink from './TransitionLink';

type Who = keyof typeof site.join.form.options;

/** /join#students, #manufacturers (or the older #makers) and #partners pick that option. */
const FROM_HASH: Record<string, Who> = {
  students: 'student', student: 'student',
  manufacturers: 'manufacturer', manufacturer: 'manufacturer', makers: 'manufacturer', maker: 'manufacturer',
  partners: 'partner', partner: 'partner',
};
const whoFromHash = () => FROM_HASH[window.location.hash.slice(1).toLowerCase()];

/**
 * A blank in the sentence: exactly as wide as what's typed in it (or its hint while empty). A
 * hidden copy of the text sits in the same grid cell and sets the width (see .blank in CSS).
 */
function Blank({ text, pick = false, children }: { text: string; pick?: boolean; children: ReactNode }) {
  return <span className={pick ? 'blank pick' : 'blank'} data-text={text}>{children}</span>;
}

/**
 * The join page. First screen: "Pick your way in." and three tall photo panels (Student,
 * Manufacturer, Partner) over a dark, maroon-washed sewing video. Hovering one widens it, lights its photo, turns its word heavy and
 * pink, and shows a frosted box with what to send; clicking it glides down to the form with
 * that option picked. Then "Say salaam.": a form written as a sentence with blanks to fill in.
 * The form isn't connected to a form service yet, so Send shows where to send it instead.
 */
export default function Join() {
  const j = site.join;
  const f = j.form;
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [who, setWho] = useState<Who>('student');
  const [fields, setFields] = useState({ name: '', city: '', contact: '' });
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  // the background video: started by hand too (some browsers skip autoplay until `muted` is set
  // as a property), and kept still for people who prefer reduced motion
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    if (prefersReducedMotion()) v.pause();
    else v.play().catch(() => {});
  }, []);

  // a link from the home page (/join#students...) picks the matching option
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

  const choose = (e: MouseEvent<HTMLAnchorElement>, w: Who) => {
    e.preventDefault();
    setWho(w);
    scrollToId('apply');
  };
  const onField = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFields((v) => ({ ...v, [name]: value }));
  };
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
  };

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
            <a key={p.who} className="jp" href="#apply" onClick={(e) => choose(e, p.who)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.img} alt="" style={{ objectPosition: p.pos }} />
              <span className="jp-n" aria-hidden="true">{p.n}</span>
              <span className="jp-b">
                <b>{p.word}</b>
                <span className="jp-d">{p.text}</span>
                <i aria-hidden="true">→</i>
              </span>
            </a>
          ))}
        </nav>
      </section>

      <section className="jn-ml" id="apply" aria-labelledby="mlH">
        <div className="jn-ml-head">
          <p className="bb-k">{f.kicker}</p>
          <h2 id="mlH" aria-label={f.heading.join(' ')}>
            <span className="ln" aria-hidden="true"><span>{f.heading[0]}</span></span>
            <span className="ln" aria-hidden="true"><span><em>{f.heading[1]}</em></span></span>
          </h2>
        </div>
        <form className="ml" noValidate onSubmit={onSubmit}>
          <p>
            Hi, my name is{' '}
            <Blank text={fields.name || f.placeholders.name}>
              <input name="name" value={fields.name} onChange={onField} placeholder={f.placeholders.name} autoComplete="name" aria-label="Your name" size={1} />
            </Blank>
            . I&rsquo;m a{' '}
            <Blank text={f.options[who]} pick>
              <select name="who" value={who} onChange={(e) => setWho(e.target.value as Who)} aria-label="I am a">
                {(Object.keys(f.options) as Who[]).map((k) => (
                  <option key={k} value={k}>{f.options[k]}</option>
                ))}
              </select>
            </Blank>{' '}
            from{' '}
            <Blank text={fields.city || f.placeholders.city}>
              <input name="city" value={fields.city} onChange={onField} placeholder={f.placeholders.city} autoComplete="address-level2" aria-label="Your city" size={1} />
            </Blank>
            .
          </p>
          <p>
            You can reach me at{' '}
            <Blank text={fields.contact || f.placeholders.contact}>
              <input name="contact" value={fields.contact} onChange={onField} placeholder={f.placeholders.contact} autoComplete="email" aria-label="E-mail or WhatsApp" size={1} />
            </Blank>
            .
          </p>
          <label className="about">
            <span className="lbl">{f.about}</span>
            <textarea name="message" rows={2} value={message} onChange={(e) => setMessage(e.target.value)} placeholder={f.hints[who]} />
          </label>
          <div className="ml-row">
            <button type="submit" className="dpill">
              <span>{f.send}</span>
              <i aria-hidden="true"><b>→</b><b>→</b></i>
            </button>
            <p className="jn-note" role="status">
              {sent && (
                <>
                  {f.notSent} <b>{site.contact.email}</b> or WhatsApp <b>{site.contact.whatsapp}</b>.
                </>
              )}
            </p>
          </div>
        </form>
      </section>
    </div>
  );
}
