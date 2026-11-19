'use client';

import { createContext, useCallback, useContext, useLayoutEffect, useRef, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/gsap';
import { scrollToId, scrollToTop } from '@/lib/scroll';
import { hideHero, revealHero } from '@/lib/hero';

export type TransitionOptions = {
  /**
   * 'circle' (default): a maroon circle grows from the click point and a cream wheel spins on it.
   * 'menu': the open menu already fills the screen; a maroon wheel draws on its cream, then the
   * wheel turns beige while the background turns maroon.
   */
  variant?: 'circle' | 'menu';
  /** Runs once the screen is fully covered, just before navigating. */
  onCovered?: () => void;
};

/**
 * Returns false if a transition is already running (the click is ignored). An href with a
 * #hash (like '/#shop') lands on that section instead of the top of the page.
 */
type Go = (href: string, x?: number, y?: number, opts?: TransitionOptions) => boolean;

const TransitionContext = createContext<Go>(() => false);

/** go(href, x, y, opts): play the wheel transition, then navigate. */
export const usePageTransition = () => useContext(TransitionContext);

const MAROON = '#3B0A0A';
const CREAM = '#EFEEEA';
const BEIGE = '#DCCBB2';

const SPOKES: [number, number, number, number][] = [
  [0, -13, 0, -80],
  [12.4, -4, 76, -24.7],
  [7.6, 10.5, 47, 64.7],
  [-7.6, 10.5, -47, 64.7],
  [-12.4, -4, -76, -24.7],
];

/**
 * A big sketched wheel draws itself and spins up over a maroon cover (a circle grown from the
 * click point, or, from the menu, the menu itself turning maroon), the route changes behind it,
 * then the cover fades and the new page's .reveal items rise in.
 */
export default function PageTransition({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  const busy = useRef(false);
  const waiting = useRef<(() => void) | null>(null);
  const ptRef = useRef<HTMLDivElement>(null);
  const wheelRef = useRef<SVGSVGElement>(null);
  const spokesRef = useRef<SVGGElement>(null);
  const ghostRef = useRef<SVGGElement>(null);
  const arcsRef = useRef<SVGGElement>(null);
  const inkRef = useRef<SVGGElement>(null);

  // The new page has rendered: carry on with the paused transition.
  useLayoutEffect(() => {
    pathRef.current = pathname;
    const resume = waiting.current;
    if (resume) {
      waiting.current = null;
      resume();
    }
  }, [pathname]);

  const go = useCallback<Go>((href, x, y, opts) => {
    if (busy.current) return false; // ignore extra clicks while a transition runs
    const isMail = href.startsWith('mailto:');
    const [path, hash] = isMail ? [href, ''] : href.split('#');
    const samePage = !isMail && (path || pathRef.current) === pathRef.current;
    // a hash that isn't a section on the new page (like /join#students) lands at the top. On the
    // page you're already on it's also put in the address, so the page still reads the choice.
    const land = () => {
      if (hash && scrollToId(hash, { immediate: true })) return;
      if (hash && samePage && window.location.hash !== `#${hash}`) {
        window.history.replaceState(window.history.state, '', `#${hash}`);
        window.dispatchEvent(new HashChangeEvent('hashchange'));
      }
      scrollToTop();
    };
    const menuMode = opts?.variant === 'menu';
    const pt = ptRef.current, wheel = wheelRef.current, spokes = spokesRef.current, ghost = ghostRef.current, arcs = arcsRef.current, ink = inkRef.current;

    if (prefersReducedMotion() || !pt || !wheel || !spokes || !ghost || !arcs || !ink) {
      opts?.onCovered?.();
      if (isMail) window.location.href = href;
      else if (samePage) land();
      else router.push(href);
      return true;
    }

    busy.current = true;
    if (!isMail && !samePage) router.prefetch(href);
    const W = window.innerWidth, H = window.innerHeight;
    const cx = x ?? W / 2, cy = y ?? H / 2;
    const R = Math.hypot(Math.max(cx, W - cx), Math.max(cy, H - cy)) + 20;

    // boil both pencil filters
    const boil = document.getElementById('boil');
    const boil2 = document.getElementById('boil2');
    let seed = 1;
    const boilTimer = window.setInterval(() => {
      seed = (seed % 40) + 1;
      boil?.setAttribute('seed', String(seed));
      boil2?.setAttribute('seed', String(seed));
    }, 130);

    // spin, with ghost spokes and motion arcs once it is fast
    const st = { s: 0.7, th: 0 };
    const spinTick = () => {
      st.th += st.s * 6 * gsap.ticker.deltaRatio();
      spokes.setAttribute('transform', `rotate(${st.th})`);
      ghost.setAttribute('transform', `rotate(${st.th})`);
      arcs.setAttribute('transform', `rotate(${st.th * 1.3})`);
      const fast = Math.min(1, Math.max(0, (st.s - 1.4) / 2));
      ghost.setAttribute('opacity', (0.4 * fast).toFixed(3));
      arcs.setAttribute('opacity', (0.6 * fast).toFixed(3));
    };
    gsap.ticker.add(spinTick);
    pt.hidden = false;

    const drawn = Array.from(wheel.querySelectorAll('.ptd'));
    let safety = 0;
    const t = gsap.timeline({
      onComplete: () => {
        gsap.ticker.remove(spinTick);
        window.clearInterval(boilTimer);
        pt.hidden = true;
        busy.current = false;
      },
    });
    if (menuMode) {
      // see-through at first, so the full-screen menu shows behind the maroon wheel
      t.set(pt, { opacity: 1, clipPath: 'none', backgroundColor: 'rgba(59,10,10,0)' });
      t.set(ink, { stroke: MAROON });
    } else {
      t.set(pt, { opacity: 1, clipPath: `circle(0px at ${cx}px ${cy}px)`, backgroundColor: MAROON });
      t.set(ink, { stroke: CREAM });
      t.to(pt, { clipPath: `circle(${R}px at ${cx}px ${cy}px)`, duration: 1.05, ease: 'power4.inOut' }, 0);
    }
    t.set(wheel, { opacity: 1, scale: 1 }, 0);
    t.set(drawn, { attr: { 'stroke-dasharray': 1, 'stroke-dashoffset': 1 } }, 0);
    t.to(drawn, { attr: { 'stroke-dashoffset': 0 }, duration: 0.7, stagger: 0.04, ease: 'power2.out' }, 0.55);
    t.to(st, { s: 4.2, duration: 3, ease: 'power1.in' }, 0.6);
    if (menuMode) {
      // the colours swap: the wheel turns beige as the background turns maroon. The wheel's swap
      // is quicker and centred on the background's, so the moment they match is only a blink.
      t.to(pt, { backgroundColor: 'rgba(59,10,10,1)', duration: 0.8, ease: 'sine.inOut' }, 2.3);
      t.to(ink, { stroke: BEIGE, duration: 0.3, ease: 'power1.inOut' }, 2.55);
    }
    t.call(() => {
      opts?.onCovered?.();
      if (isMail) { window.location.href = href; hideHero(); return; }
      if (samePage) { land(); hideHero(); return; }
      // Route change: hold here, wheel still spinning, until the new page is in.
      t.pause();
      const resume = () => {
        window.clearTimeout(safety);
        land();
        hideHero();
        ScrollTrigger.refresh();
        t.play();
      };
      waiting.current = resume;
      safety = window.setTimeout(() => {
        if (waiting.current === resume) { waiting.current = null; resume(); }
      }, 8000);
      router.push(href, { scroll: false });
    }, undefined, 3.5);
    t.to(wheel, { opacity: 0, scale: 0.82, duration: 0.6, ease: 'power3.inOut' }, 3.55);
    t.to(pt, { opacity: 0, duration: 1.1, ease: 'power2.inOut' }, 3.8);
    t.call(() => { revealHero(); }, undefined, 3.95);
    return true;
  }, [router]);

  return (
    <TransitionContext.Provider value={go}>
      {children}
      <div id="pt" ref={ptRef} hidden aria-hidden="true">
        <svg id="ptWheelSvg" ref={wheelRef} viewBox="-130 -130 260 260">
          <g ref={inkRef} filter="url(#pencilRough)" fill="none" stroke={CREAM} strokeLinecap="round" strokeLinejoin="round">
            <g ref={arcsRef} strokeWidth={2.2} opacity={0}>
              <circle r="112" strokeDasharray="90 520" />
              <circle r="122" strokeDasharray="70 560" strokeDashoffset={250} />
              <circle r="104" strokeDasharray="60 480" strokeDashoffset={420} />
            </g>
            <g ref={ghostRef} strokeWidth={2} opacity={0}>
              {[-6, -12, -18].map((deg) => (
                <g key={deg} transform={`rotate(${deg})`}>
                  {SPOKES.map(([x1, y1, x2, y2]) => (
                    <line key={`${x2},${y2}`} pathLength={1} x1={x1} y1={y1} x2={x2} y2={y2} />
                  ))}
                </g>
              ))}
            </g>
            <circle className="ptd" pathLength={1} r="100" strokeWidth={4} />
            <circle className="ptd" pathLength={1} cx="2.5" cy="-2" r="99" strokeWidth={1.8} opacity={0.45} />
            <circle className="ptd" pathLength={1} r="82" strokeWidth={2.2} />
            <circle className="ptd" pathLength={1} r="23" strokeWidth={2} />
            <circle className="ptd" pathLength={1} r="12" strokeWidth={3.2} />
            <g ref={spokesRef} strokeWidth={5}>
              {SPOKES.map(([x1, y1, x2, y2]) => (
                <line key={`${x2},${y2}`} className="ptd" pathLength={1} x1={x1} y1={y1} x2={x2} y2={y2} />
              ))}
              <circle className="ptd" pathLength={1} cx="38" cy="-84" r="9" stroke="#E9A23B" strokeWidth={4} />
            </g>
          </g>
        </svg>
      </div>
    </TransitionContext.Provider>
  );
}
