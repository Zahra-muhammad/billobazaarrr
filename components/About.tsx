'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { registerEntrance } from '@/lib/hero';
import { site } from '@/data/site';
import { Wordmark } from './LogoSymbol';
import TransitionLink from './TransitionLink';

/** A heading's lines, each in its own mask so it can rise; the last line is the heavy pink one. */
function Lines({ lines }: { lines: readonly string[] }) {
  return (
    <>
      {lines.map((line, i) => (
        <span key={line} className={i === lines.length - 1 ? 'ln b' : 'ln'} aria-hidden="true">
          <span>{i === lines.length - 1 ? <em>{line}</em> : line}</span>
        </span>
      ))}
    </>
  );
}

/**
 * The about page, in the same language as the home and join pages (dark maroon, peach, pink;
 * Archivo's narrow capitals mixing light and heavy; Inter Tight text; creamy motion):
 *  1. "Talent doesn't stop at graduation." over a maroon-washed sewing video
 *  2. why we exist: a paragraph that lights up word by word, two photos drifting at the sides
 *  3. two lines of big words sliding past each other as you scroll
 *  4. what we do: six rows that turn heavy and pink on hover, beside a held heading whose photo
 *     cross-fades to the row you're on
 *  5. "Come and join us." with the way into the join page
 */
export default function About() {
  const a = site.about;
  const ref = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(0);
  const words = a.why.text.split(' ');

  // the background video: started by hand too (some browsers skip autoplay until `muted` is set
  // as a property), and kept still for people who prefer reduced motion
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    if (prefersReducedMotion()) v.pause();
    else v.play().catch(() => {});
  }, []);

  useGSAP(() => {
    if (prefersReducedMotion()) return;
    // the first screen: heading lines rise, then the label and intro come into focus. Registered
    // with lib/hero, so under the page-change cover it waits and plays as the cover lifts.
    const tl = gsap.timeline({ delay: 0.15 });
    tl.from('.ab-t .ln > span', { yPercent: 110, duration: 1.6, stagger: 0.14, ease: 'expo.out' }, 0)
      .from('.ab-hero .ab-fade', { opacity: 0, y: 30, filter: 'blur(8px)', duration: 1.5, stagger: 0.12, ease: 'expo.out', clearProps: 'filter' }, 0.45);
    const unregister = registerEntrance({ hide: () => tl.pause(0), reveal: () => tl.restart() });

    // scrolling on: the first screen's words lift and fade a little
    gsap.to('.ab-hero-in', { yPercent: -14, opacity: 0.3, ease: 'none', scrollTrigger: { trigger: '.ab-hero', start: 'top top', end: 'bottom top', scrub: 1 } });

    // why we exist: the words light up one by one, the photos drift at different speeds
    gsap.to('.ab-why .big .wd', { opacity: 1, stagger: 0.08, ease: 'none', scrollTrigger: { trigger: '.ab-why .big', start: 'top 80%', end: 'bottom 50%', scrub: 1.2 } });
    gsap.utils.toArray<HTMLElement>('.ab-ph').forEach((el, i) => {
      gsap.fromTo(el, { yPercent: i ? 40 : 15 }, { yPercent: i ? -35 : -20, ease: 'none', scrollTrigger: { trigger: '.ab-why', start: 'top bottom', end: 'bottom top', scrub: 1 } });
    });

    // headings rise line by line as they scroll into view
    gsap.utils.toArray<HTMLElement>('.ab-rise').forEach((h) => {
      gsap.from(h.querySelectorAll('.ln > span'), { yPercent: 108, duration: 1.6, stagger: 0.12, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 85%', toggleActions: 'play none none reverse' } });
    });

    // the word band: the two lines slide past each other
    gsap.utils.toArray<HTMLElement>('.ab-band .row').forEach((row, i) => {
      gsap.fromTo(row, { xPercent: i % 2 ? -30 : 0 }, { xPercent: i % 2 ? 0 : -30, ease: 'none', scrollTrigger: { trigger: '.ab-band', start: 'top bottom', end: 'bottom top', scrub: 1 } });
    });

    // what we do: the rows rise in one after another
    gsap.from('.ab-row', { y: 40, opacity: 0, duration: 1.4, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: '.ab-rows', start: 'top 80%' } });

    return unregister;
  }, { scope: ref });

  return (
    <div className="about" ref={ref}>
      {/* 1. first screen */}
      <section className="ab-hero" aria-labelledby="abH">
        <div className="washbg" aria-hidden="true">
          <video ref={videoRef} muted loop playsInline autoPlay preload="auto">
            <source src={a.videoSrc} type="video/mp4" />
          </video>
        </div>
        <TransitionLink className="pg-logo" href="/" aria-label={`${site.name} home`}>
          <Wordmark aria-hidden="true" />
        </TransitionLink>
        <div className="ab-hero-in">
          <p className="bb-k ab-fade">{a.kicker}</p>
          <h1 id="abH" className="ab-t" aria-label={a.heading.join(' ')}>
            <Lines lines={a.heading} />
          </h1>
          <p className="ab-lede ab-fade">{a.lede}</p>
        </div>
      </section>

      {/* 2. why we exist */}
      <section className="ab-why" aria-labelledby="abWhy">
        <div className="in">
          <p className="bb-k">{a.why.kicker}</p>
          <p className="big">
            {words.map((w, i) => (
              <Fragment key={i}>
                {i > 0 && ' '}
                <span className="wd">{w}</span>
              </Fragment>
            ))}
          </p>
          <h2 id="abWhy" className="ab-rise" aria-label={a.why.line.join(' ')}>
            <Lines lines={a.why.line} />
          </h2>
        </div>
        <div className="ab-phs" aria-hidden="true">
          {a.why.photos.map((p, i) => (
            <figure key={p.img} className={i ? 'ab-ph b' : 'ab-ph a'}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.img} alt="" style={{ objectPosition: p.pos }} />
            </figure>
          ))}
        </div>
      </section>

      {/* 3. the word band (decorative: the same words are on the page in full) */}
      <div className="ab-band" aria-hidden="true">
        {a.bands.map((band, r) => (
          <div className="row" key={r}>
            {[0, 1, 2].map((rep) =>
              band.map((w, i) => (
                <span key={`${rep}-${w}`} className={i % 2 ? 'b' : undefined}>
                  {w}
                  <i />
                </span>
              )),
            )}
          </div>
        ))}
      </div>

      {/* 4. what we do */}
      <section className="ab-what" aria-labelledby="abWhat">
        <div className="ab-what-head">
          <p className="bb-k">{a.what.kicker}</p>
          <h2 id="abWhat" className="ab-rise" aria-label={a.what.heading.join(' ')}>
            <Lines lines={a.what.heading} />
          </h2>
          <figure className="ab-frame" aria-hidden="true">
            {a.what.items.map((it, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={it.img} src={it.img} alt="" className={i === active ? 'on' : undefined} style={{ objectPosition: it.pos }} />
            ))}
          </figure>
        </div>
        <ol className="ab-rows">
          {a.what.items.map((it, i) => (
            <li key={it.title} className="ab-row" onPointerEnter={() => setActive(i)}>
              <span className="ab-n" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              <h3>{it.title}</h3>
              <p>{it.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 5. the way in */}
      <section className="ab-cta" aria-labelledby="abCta">
        <p className="bb-k">{a.cta.kicker}</p>
        <h2 id="abCta" className="ab-rise" aria-label={a.cta.heading.join(' ')}>
          <Lines lines={a.cta.heading} />
        </h2>
        <TransitionLink className="dpill" href={a.cta.button.href}>
          <span>{a.cta.button.label}</span>
          <i aria-hidden="true"><b>→</b><b>→</b></i>
        </TransitionLink>
        <nav className="ab-who" aria-label="Ways to join">
          {a.cta.links.map((l) => (
            <TransitionLink key={l.href} href={l.href}>{l.label}</TransitionLink>
          ))}
        </nav>
      </section>
    </div>
  );
}
