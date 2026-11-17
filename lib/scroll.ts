import type Lenis from 'lenis';
import { prefersReducedMotion } from './gsap';

/** The running smooth scroller (set by <SmoothScroll>), or null when it is off (reduced motion). */
let lenis: Lenis | null = null;

export const setLenis = (l: Lenis | null) => {
  lenis = l;
};

/** Jump straight to the top, and stop any glide still in progress so it can't pull the page back. */
export function scrollToTop() {
  window.scrollTo(0, 0);
  lenis?.scrollTo(0, { immediate: true, force: true });
}

/**
 * Scroll to the element with this id (a section such as #how): a smooth glide, or with
 * `immediate` a straight jump (used under the page-transition cover). Returns false when there
 * is no such element (a hash like /join#students only picks an option, it is not a section).
 */
export function scrollToId(id: string, { immediate = false } = {}) {
  const el = document.getElementById(id);
  if (!el) return false;
  // re-measure first: right after a page change the scroller still has the old page's height
  // and would stop short of a section further down
  lenis?.resize();
  const y = Math.round(el.getBoundingClientRect().top + window.scrollY);
  if (immediate) {
    window.scrollTo(0, y);
    lenis?.scrollTo(y, { immediate: true, force: true });
  } else if (lenis) {
    lenis.scrollTo(y, { force: true });
  } else {
    window.scrollTo({ top: y, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }
  return true;
}
