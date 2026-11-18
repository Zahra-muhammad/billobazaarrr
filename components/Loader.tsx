'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { gsap, EVENTS, prefersReducedMotion } from '@/lib/gsap';
import { scrollToTop } from '@/lib/scroll';
import { hideHero, revealHero } from '@/lib/hero';
import { site } from '@/data/site';
import { FULL_LOGO_VIEWBOX, WORDMARK_VIEWBOX } from './LogoSymbol';

const NS = 'http://www.w3.org/2000/svg';
const CHROME = '.landing .mark, .pill, .sitebar';
const MINI_SPOKES: [number, number, number, number][] = [
  [0, -8, 0, -40],
  [7.6, -2.5, 38, -12.4],
  [4.7, 6.5, 23.5, 32.4],
  [-4.7, 6.5, -23.5, 32.4],
  [-7.6, -2.5, -38, -12.4],
];

/**
 * The intro (about 6s): the logo is sewn with running stitches while a little handwheel spins
 * and a counter runs to 100, then the wordmark flies to the home hero's logo, top centre. It
 * plays when the site is opened on the home page; opened on any other page, that page just
 * shows with its own entrance. The footer's "Replay intro" plays it on any page (there the sewn
 * logo just fades away at the end).
 */
export default function Loader() {
  // the page the site was opened on (this stays put while you move between pages)
  const pathname = usePathname();
  const [opensHome] = useState(() => pathname === '/');

  useEffect(() => {
    const byId = <T,>(id: string) => document.getElementById(id) as unknown as T;
    const root = document.documentElement;
    const loader = byId<HTMLDivElement>('loader');
    const boil = byId<SVGElement>('boil');
    const pct = byId<HTMLSpanElement>('pct');
    const skip = byId<HTMLButtonElement>('skip');
    const logoSvg = byId<SVGSVGElement>('logoSvg');
    const logoG = byId<SVGGElement>('logoG');
    const logoInk = byId<SVGUseElement>('logoInk');
    const logoFill = byId<SVGUseElement>('logoFill');
    const maskInk = byId<SVGGElement>('maskInk');
    const needleG = byId<SVGGElement>('needleG');
    const needleLift = byId<SVGGElement>('needleLift');
    const needleBob = byId<SVGGElement>('needleBob');
    const miniWheel = byId<SVGSVGElement>('miniWheel');
    const mwSpokes = byId<SVGGElement>('mwSpokes');
    const logoPath = byId<SVGPathElement>('logoPath');
    const flyer = byId<SVGSVGElement>('flyer');
    if (!loader || !logoPath) return;

    // Running stitches: 11 units on, 8 off. The path has pathLength=1, so divide by its real length.
    const LL = logoPath.getTotalLength();
    logoInk.setAttribute('stroke-dasharray', `${11 / LL} ${8 / LL}`);

    // Reveal mask: one white stroke per sub-path, so every part of the logo is sewn at once.
    if (!maskInk.firstChild) {
      (logoPath.getAttribute('d') || '').split(/(?=M)/).forEach((sub) => {
        const p = document.createElementNS(NS, 'path');
        p.setAttribute('d', sub);
        maskInk.appendChild(p);
      });
    }
    const parts = Array.from(maskInk.children as HTMLCollectionOf<SVGPathElement>).map((el) => {
      const len = el.getTotalLength();
      el.setAttribute('stroke-dasharray', `${len} ${len}`);
      el.setAttribute('stroke-dashoffset', String(len));
      return { el, len };
    });
    // The needle rides the longest sub-path: the outer oval.
    const lead = parts.reduce((a, b) => (b.len > a.len ? b : a), parts[0]);

    const sew = { p: 0 };
    const spin = { s: 0, theta: 0 };
    let tl: gsap.core.Timeline | null = null;
    let heroTl: gsap.core.Timeline | null = null;
    let flyTween: gsap.core.Tween | null = null;
    let boilTimer = 0;
    let readyFrame = 0;

    function moveNeedle() {
      const pt = lead.el.getPointAtLength(sew.p * lead.len);
      needleG.setAttribute('transform', `translate(${pt.x} ${pt.y})`);
      needleBob.setAttribute('transform', `translate(0 ${Math.sin(sew.p * 40) * 6 - 4})`);
      for (const q of parts) q.el.setAttribute('stroke-dashoffset', String(q.len * (1 - sew.p)));
    }
    function setCounter(v: number) {
      pct.textContent = String(Math.round(v)).padStart(2, '0');
    }
    function stopBoil() {
      window.clearInterval(boilTimer);
    }

    function finish() {
      stopBoil();
      flyTween?.kill();
      flyTween = null;
      flyer.style.display = 'none';
      gsap.set(CHROME, { opacity: 1 });
      root.classList.remove('loading');
      gsap.to(loader, { opacity: 0, duration: 0.35, onComplete: () => { loader.hidden = true; } });
    }

    function start(replay: boolean) {
      tl?.kill();
      heroTl?.kill();
      heroTl = null;
      flyTween?.kill();
      flyTween = null;
      flyer.style.display = 'none';
      stopBoil();
      scrollToTop();

      if (prefersReducedMotion()) {
        loader.hidden = true;
        root.classList.remove('loading');
        gsap.set(CHROME, { opacity: 1 });
        return;
      }

      // opened on another page: no intro, just that page's entrance
      if (!replay && !opensHome) {
        loader.hidden = true;
        gsap.set(CHROME, { opacity: 1 });
        hideHero();
        heroTl = revealHero();
        readyFrame = requestAnimationFrame(() => window.dispatchEvent(new Event(EVENTS.ready)));
        return;
      }

      // reset everything, so Replay starts from scratch
      root.classList.add('loading');
      loader.hidden = false;
      gsap.killTweensOf([loader, logoSvg]);
      gsap.set(loader, { opacity: 1 });
      gsap.set([pct, skip], { opacity: 1 });
      gsap.set('#logoPanel', { backgroundColor: '#EFEEEA' });
      gsap.set(logoSvg, { opacity: 1 });
      gsap.set(logoG, { opacity: 1 });
      gsap.set(logoFill, { opacity: 0 });
      gsap.set(needleG, { opacity: 0 });
      gsap.set(needleLift, { y: 0 });
      gsap.set(miniWheel, { opacity: 0, scale: 1 });
      gsap.set(CHROME, { opacity: 0 });
      hideHero();
      sew.p = 0;
      moveNeedle();
      setCounter(0);
      spin.s = 0.4;

      let n = 1;
      boilTimer = window.setInterval(() => {
        n = (n % 40) + 1;
        boil.setAttribute('seed', String(n));
      }, 160);

      const progress = { v: 0 };
      tl = gsap.timeline({ onComplete: finish });
      tl.to(progress, { v: 100, duration: 4.6, ease: 'power1.inOut', onUpdate: () => setCounter(progress.v) }, 0);
      tl.to(spin, { s: 1.6, duration: 4.6, ease: 'sine.in' }, 0);
      tl.to(needleG, { opacity: 1, duration: 0.2 }, 0);
      tl.to(sew, { p: 1, duration: 4.0, ease: 'sine.inOut', onUpdate: moveNeedle }, 0.05);
      tl.to(miniWheel, { opacity: 1, duration: 0.5, ease: 'power1.out' }, 0.1);
      tl.to(logoFill, { opacity: 1, duration: 0.7, ease: 'sine.inOut' }, 3.9);
      tl.to(logoG, { opacity: 0, duration: 0.7, ease: 'sine.inOut' }, 4.0);
      tl.to(needleG, { opacity: 0, duration: 0.35, ease: 'power2.in' }, 4.0);
      tl.to(needleLift, { y: -30, duration: 0.35, ease: 'power2.in' }, 4.0);
      tl.to(miniWheel, { opacity: 0, scale: 0.6, duration: 0.45, ease: 'power2.inOut' }, 4.6);
      tl.to([pct, skip], { opacity: 0, duration: 0.4 }, 4.6);
      tl.call(stopBoil, undefined, 4.7);
      // the wordmark leaves the sewn logo and lands exactly on the landing's logo
      tl.call(() => {
        const target = document.querySelector('.landing .mark svg');
        if (!target) {
          gsap.to(logoSvg, { opacity: 0, duration: 0.5, ease: 'sine.out' });
          return;
        }
        const L = logoSvg.getBoundingClientRect();
        const k = L.width / 1345;
        const T = target.getBoundingClientRect();
        flyer.style.display = 'block';
        gsap.set(flyer, { left: L.left + (584 - 328) * k, top: L.top + (783 - 623) * k, width: 781 * k, height: 357 * k, color: '#3B0A0A' });
        gsap.to(logoSvg, { opacity: 0, duration: 0.35, ease: 'sine.out' });
        flyTween = gsap.to(flyer, { left: T.left, top: T.top, width: T.width, height: T.height, color: '#EFEEEA', duration: 1.15, ease: 'expo.inOut' });
      }, undefined, 4.85);
      tl.to('#logoPanel', { backgroundColor: 'rgba(239,238,234,0)', duration: 1.0, ease: 'sine.inOut' }, 4.95);
      tl.call(() => { heroTl = revealHero(); }, undefined, 5.05);
      tl.call(() => { window.dispatchEvent(new Event(EVENTS.ready)); }, undefined, 5.3);
      tl.to('.pill', { opacity: 1, duration: 0.8, ease: 'sine.out' }, 5.6);
      tl.to({}, { duration: 0.01 }, 6.0);
    }

    // the mini wheel turns on every GSAP tick while the loader is up
    const tick = () => {
      if (loader.hidden) return;
      spin.theta += spin.s * 6 * gsap.ticker.deltaRatio();
      mwSpokes.setAttribute('transform', `rotate(${spin.theta})`);
    };
    const onSkip = () => { tl?.progress(1); };
    const onReplay = () => start(true);

    gsap.ticker.add(tick);
    skip.addEventListener('click', onSkip);
    window.addEventListener(EVENTS.replay, onReplay);
    start(false);

    return () => {
      tl?.kill();
      heroTl?.kill();
      flyTween?.kill();
      stopBoil();
      cancelAnimationFrame(readyFrame);
      gsap.ticker.remove(tick);
      skip.removeEventListener('click', onSkip);
      window.removeEventListener(EVENTS.replay, onReplay);
      root.classList.remove('loading');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once; opensHome never changes
  }, []);

  return (
    // hidden from the start when the site opens on another page, so the intro never flashes
    <div id="loader" hidden={!opensHome}>
      <div id="logoPanel" aria-hidden="true">
        <svg id="logoSvg" viewBox={FULL_LOGO_VIEWBOX} overflow="visible">
          <defs>
            <mask id="stitchMask" maskUnits="userSpaceOnUse" x="250" y="540" width="1500" height="920">
              <g id="maskInk" fill="none" stroke="#fff" strokeWidth={16} strokeLinecap="round" />
            </mask>
          </defs>
          <g id="logoG" filter="url(#pencil)">
            <g mask="url(#stitchMask)">
              <use id="logoInk" href="#logoPath" fill="none" stroke="#3B0A0A" strokeWidth={3.4} strokeLinecap="round" />
            </g>
          </g>
          <use id="logoFill" href="#logoPath" fill="#3B0A0A" opacity={0} />
          <g id="needleG" opacity={0}>
            <g id="needleLift">
              <g id="needleBob" filter="url(#pencil)" fill="none" strokeLinecap="round">
                <path d="M0 0 L64 -64" stroke="#6E6862" strokeWidth={5} />
                <path d="M0 0 L64 -64" stroke="#C9C4BD" strokeWidth={2} />
                <ellipse cx="56" cy="-56" rx="3" ry="7" transform="rotate(45 56 -56)" stroke="#3B0A0A" strokeWidth={2} />
                <path d="M56 -56 C90 -70 96 -110 140 -112" stroke="#E9A23B" strokeWidth={3} />
              </g>
            </g>
          </g>
        </svg>
        <svg id="miniWheel" viewBox="-60 -60 120 120" style={{ opacity: 0 }}>
          <g filter="url(#pencil)" fill="none" stroke="#3B0A0A" strokeLinecap="round">
            <circle r="50" strokeWidth={5} />
            <circle r="41" strokeWidth={2.4} />
            <circle r="8" strokeWidth={3.6} />
            <g id="mwSpokes" strokeWidth={4.4}>
              {MINI_SPOKES.map(([x1, y1, x2, y2]) => (
                <line key={`${x2},${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} />
              ))}
              <circle cx="20" cy="-42" r="5" stroke="#E9A23B" strokeWidth={3.4} />
            </g>
          </g>
        </svg>
      </div>
      <svg id="flyer" viewBox={WORDMARK_VIEWBOX} aria-hidden="true">
        <use href="#logoPath" fill="currentColor" />
      </svg>
      <span className="loadpct" id="pct" aria-hidden="true">00</span>
      <button id="skip" type="button">{site.loader.skip}</button>
    </div>
  );
}
