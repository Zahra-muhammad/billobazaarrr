'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/gsap';
import { setLenis } from '@/lib/scroll';

/**
 * Luxury smooth scroll: a slow, weighted glide (Lenis), driven by the GSAP ticker so every
 * ScrollTrigger animation stays in step. It pauses while the intro runs (html.loading) or the
 * menu is open (html overflow hidden), and stays off for people who prefer reduced motion.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return;
    // lerp: every frame the page moves 7% of the way to where the wheel says, so scrolling
    // flows on continuously (creamy) instead of restarting a fixed glide with each wheel tick
    const lenis = new Lenis({
      lerp: 0.07,
      wheelMultiplier: 0.85,
      touchMultiplier: 1.2,
      smoothWheel: true,
    });
    setLenis(lenis);
    const offScroll = lenis.on('scroll', () => ScrollTrigger.update());
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // pause while the loader runs or the menu is open
    const root = document.documentElement;
    let stopped = false;
    const sync = () => {
      const want = root.classList.contains('loading') || root.style.overflow === 'hidden';
      if (want === stopped) return;
      stopped = want;
      if (want) lenis.stop();
      else lenis.start();
    };
    const observer = new MutationObserver(sync);
    observer.observe(root, { attributes: true, attributeFilter: ['class', 'style'] });
    sync();

    return () => {
      observer.disconnect();
      gsap.ticker.remove(tick);
      gsap.ticker.lagSmoothing(500, 33);
      offScroll();
      lenis.destroy();
      setLenis(null);
    };
  }, []);

  return null;
}
