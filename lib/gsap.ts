import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

export const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia(REDUCED_MOTION).matches;

/** Window events the pieces of the site use to talk to each other. */
export const EVENTS = {
  /** Fired at 5.3s into the intro, so ScrollTrigger can measure the settled page. */
  ready: 'billo:ready',
  /** Fired by the footer "Replay intro" button. */
  replay: 'billo:replay',
} as const;

export { gsap, ScrollTrigger, useGSAP };
