'use client';

import { Fragment, useEffect, type RefObject } from 'react';
import { EVENTS, ScrollTrigger, prefersReducedMotion } from '@/lib/gsap';

/**
 * The home headline (Inter Tight, a variable font). Every letter rests at weight 300 and gets
 * bolder, up to 700, as the cursor comes near (a soft round falloff, each letter easing towards
 * its target, so they swell and settle smoothly). When the intro finishes, a wave sweeps across
 * it once. The same hook keeps line 1 on one line (it shrinks the font to fit) and lines the
 * glass cards on the right up with the headline block. Reduced motion: no weight changes.
 */
const REST = 300;
const PEAK = 700;
/** how far the swell reaches from the cursor (px) */
const R = 170;
/** how quickly each letter follows its target, per 60fps frame */
const EASE = 0.085;
/** how long the sweep takes to cross the headline (ms) */
const SWEEP_MS = 3000;

/** One line of the headline: a <span class="w"> per word, a <span class="ch"> per letter. */
export function VarLine({ text, className }: { text: string; className: string }) {
  return (
    <span className={className} aria-hidden="true">
      {text.split(' ').map((word, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          <span className="w">
            {Array.from(word).map((c, k) => (
              <span className="ch" key={k}>{c}</span>
            ))}
          </span>
        </Fragment>
      ))}
    </span>
  );
}

type Letter = { el: HTMLElement; f: number; w: number; x: number; y: number };

export function useHeroHeadline(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const h = ref.current;
    const hero = h?.closest<HTMLElement>('.landing');
    if (!h || !hero) return;
    const stack = hero.querySelector<HTMLElement>('.hstack');
    const cards = hero.querySelector<HTMLElement>('.hcards');

    // line 1 never wraps: shrink the font until the widest line fits (56% of the hero on
    // desktop, 86% on tablets and phones)
    const fit = () => {
      h.style.fontSize = '';
      const max = hero.clientWidth * (window.innerWidth <= 960 ? 0.86 : 0.56);
      let wid = 0;
      for (const line of Array.from(h.children)) wid = Math.max(wid, line.scrollWidth);
      if (wid > max) h.style.fontSize = `${(parseFloat(getComputedStyle(h).fontSize) * max) / wid}px`;
    };
    // the cards on the right: top level with "From fashion", bottom level with the button.
    // offsetTop/offsetHeight ignore the entrance's transforms, so this is right at any moment.
    const alignCards = () => {
      if (!cards || !stack) return;
      if (window.innerWidth <= 960) {
        cards.style.removeProperty('top');
        cards.style.removeProperty('bottom');
        cards.style.removeProperty('height');
        return;
      }
      cards.style.top = `${stack.offsetTop}px`;
      cards.style.bottom = 'auto';
      cards.style.height = `${stack.offsetHeight}px`;
    };
    const layout = () => { fit(); alignCards(); };

    const reduced = prefersReducedMotion();
    const letters: Letter[] = Array.from(h.querySelectorAll<HTMLElement>('.ch')).map((el) => ({ el, f: 0, w: REST, x: 0, y: 0 }));
    let px = -9999, py = -9999;
    let sweep: { t: number } | null = null;
    let raf = 0, last = 0;

    const measure = () => {
      for (const c of letters) {
        const r = c.el.getBoundingClientRect();
        c.x = r.left + r.width / 2;
        c.y = r.top + r.height / 2;
      }
    };

    const tick = (now: number) => {
      const dt = last ? Math.min(64, now - last) : 16.7;
      last = now;
      let moving = false;
      if (sweep) {
        sweep.t += dt / SWEEP_MS;
        const r = h.getBoundingClientRect();
        px = r.left - R + (r.width + 2 * R) * sweep.t;
        py = r.top + r.height * (sweep.t < 0.5 ? 0.3 : 0.75);
        if (sweep.t >= 1) { sweep = null; px = py = -9999; }
        moving = true;
      }
      const k = 1 - Math.pow(1 - EASE, dt / 16.7);
      for (const c of letters) {
        const dx = c.x - px, dy = (c.y - py) * 1.4;
        const target = Math.exp(-(dx * dx + dy * dy) / (R * R));
        const nf = c.f + (target - c.f) * k;
        if (Math.abs(nf - c.f) > 0.001) moving = true;
        c.f = nf;
        const w = Math.round(REST + (PEAK - REST) * nf);
        if (w !== c.w) {
          c.w = w;
          c.el.style.fontVariationSettings = `"wght" ${w}`;
        }
      }
      if (moving) raf = requestAnimationFrame(tick);
      else { raf = 0; last = 0; }
    };
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };

    // mouse and pen only: on touch screens a drag is a scroll, so the letters just get the sweep
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      sweep = null;
      px = e.clientX;
      py = e.clientY;
      kick();
    };
    const onLeave = () => { px = py = -9999; kick(); };
    const onScroll = () => measure();
    // re-fit and re-align whenever the hero's size really changes. The hero is pinned by
    // ScrollTrigger (see Intro), which holds its old size until it refreshes after a window
    // resize, so measuring on the resize event alone gets stale numbers. Watching the hero
    // itself (and ScrollTrigger's refresh) catches the settled size. Only the hero is watched:
    // the letters swelling under the cursor change the headline's width, not the hero's.
    let rq = 0;
    const onResize = () => {
      if (rq) return;
      rq = requestAnimationFrame(() => { rq = 0; layout(); measure(); });
    };
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
    ro?.observe(hero);
    ScrollTrigger.addEventListener('refresh', onResize);
    const timers: number[] = [];
    const onReady = () => {
      if (!reduced) timers.push(window.setTimeout(() => { measure(); sweep = { t: 0 }; kick(); }, 300));
      timers.push(window.setTimeout(alignCards, 1300));
    };

    layout();
    measure();
    let alive = true;
    document.fonts?.ready.then(() => { if (alive) { layout(); measure(); } });
    window.addEventListener('resize', onResize);
    window.addEventListener(EVENTS.ready, onReady);
    if (!reduced) {
      window.addEventListener('pointermove', onMove, { passive: true });
      document.documentElement.addEventListener('pointerleave', onLeave);
      window.addEventListener('scroll', onScroll, { passive: true });
    }

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      cancelAnimationFrame(rq);
      ro?.disconnect();
      ScrollTrigger.removeEventListener('refresh', onResize);
      timers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener('resize', onResize);
      window.removeEventListener(EVENTS.ready, onReady);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('scroll', onScroll);
      for (const c of letters) c.el.style.fontVariationSettings = '';
    };
  }, [ref]);
}
