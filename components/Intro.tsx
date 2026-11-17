'use client';

import { Fragment, useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP } from '@/lib/gsap';
import { site } from '@/data/site';
import IntroOrnament from './IntroOrnament';

/**
 * "Your sketch, made real.": a dark card with rounded top corners that slides straight up over
 * the hero, which stays pinned (no extra scroll space) and darkens underneath. Its top edge
 * already peeks 64px into the first screen on desktop (globals.css). The heading's tall
 * narrow lines rise one by one; the paragraph lights up word by word as you scroll.
 */
export default function Intro() {
  const t = site.intro;
  const ref = useRef<HTMLElement>(null);
  const words = t.text.split(' ');

  useGSAP(() => {
    const sec = ref.current;
    if (!sec) return;
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.intro2 h2 .ln > span', {
        yPercent: 105, duration: 1.6, stagger: 0.14, ease: 'expo.out',
        scrollTrigger: { trigger: sec, start: 'top 65%', toggleActions: 'play none none reverse' },
      });
      // the hero holds still while this card rises over it, darkening as it is covered. On
      // desktop the card already peeks 64px into the first screen (margin-top -64px), so the
      // darkening starts from where the card sits at rest: only once you start scrolling.
      const hero = document.querySelector<HTMLElement>('.landing');
      if (hero) {
        ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom top', pin: true, pinSpacing: false });
        gsap.fromTo(hero, { filter: 'brightness(1)' }, {
          filter: 'brightness(0.45)', ease: 'none',
          scrollTrigger: {
            trigger: sec,
            start: () => `top ${Math.min(window.innerHeight, hero.offsetHeight) + (parseFloat(getComputedStyle(sec).marginTop) || 0)}px`,
            end: 'top top', scrub: 0.8, invalidateOnRefresh: true,
          },
        });
      }
      // the line-art frame sews itself in as the card rises; the stitched lines fade in
      gsap.fromTo('.intro2 .orn .d', { strokeDashoffset: 1 }, {
        strokeDashoffset: 0, ease: 'none', stagger: 0.012,
        scrollTrigger: { trigger: sec, start: 'top 95%', end: 'center 60%', scrub: 1.2 },
      });
      gsap.fromTo('.intro2 .orn .st, .intro2 .orn .ticks', { opacity: 0 }, {
        opacity: 1, ease: 'none',
        scrollTrigger: { trigger: sec, start: 'top 80%', end: 'center 60%', scrub: 1.2 },
      });
      gsap.to('.intro2 p .wd', {
        opacity: 1, stagger: 0.08, ease: 'none',
        scrollTrigger: { trigger: '.intro2 p', start: 'top 80%', end: 'bottom 45%', scrub: 1.2 },
      });
    });
  }, { scope: ref });

  return (
    <section className="intro2" id="about" ref={ref}>
      <IntroOrnament />
      <div className="in">
        <h2 aria-label={t.lines.join(' ')}>
          {t.lines.map((line, i) => (
            <span key={line} className={i === 0 ? 'ln sm' : 'ln'} aria-hidden="true">
              <span>{line}</span>
            </span>
          ))}
        </h2>
        <p>
          {words.map((w, i) => (
            <Fragment key={i}>
              {i > 0 && ' '}
              <span className="wd">{w}</span>
            </Fragment>
          ))}
        </p>
      </div>
    </section>
  );
}
