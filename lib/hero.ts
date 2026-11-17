import { gsap } from './gsap';

/**
 * The first screen's entrance, shared by the intro (Loader) and the page transition: an inner
 * page's headline lines rise out of their masks, then everything marked .reveal (the home hero's
 * headline, button, cards and bottom row, or an inner page's lede) fades up one after another.
 * A page with its own entrance (the join page) registers it here, so it is held back while the
 * cover is up and played when the cover lifts, like the rest.
 */
const LINES = '.hero .hl-in';
const ITEMS = '.hero .reveal';
const all = (selector: string) => gsap.utils.toArray<HTMLElement>(selector);

type Entrance = { hide: () => void; reveal: () => void };
const entrances = new Set<Entrance>();

/** Add a page's own entrance; returns the function that removes it again. */
export function registerEntrance(entrance: Entrance) {
  entrances.add(entrance);
  return () => { entrances.delete(entrance); };
}

/** Hidden and ready to be revealed. */
export function hideHero() {
  const lines = all(LINES), items = all(ITEMS);
  gsap.killTweensOf([...lines, ...items]);
  if (lines.length) gsap.set(lines, { yPercent: 105 });
  if (items.length) gsap.set(items, { opacity: 0, y: 36, filter: 'blur(8px)' });
  entrances.forEach((e) => e.hide());
}

/** Play the entrance; returns its timeline. */
export function revealHero() {
  const lines = all(LINES), items = all(ITEMS);
  const tl = gsap.timeline();
  if (lines.length) tl.to(lines, { yPercent: 0, duration: 1.5, stagger: 0.14, ease: 'expo.out' }, 0);
  if (items.length) tl.to(items, { opacity: 1, y: 0, filter: 'blur(0px)', duration: 1.5, stagger: 0.12, ease: 'expo.out', clearProps: 'filter' }, lines.length ? 0.35 : 0);
  entrances.forEach((e) => e.reveal());
  return tl;
}
