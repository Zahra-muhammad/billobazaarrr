'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { gsap, prefersReducedMotion } from '@/lib/gsap';
import BigMenu from './BigMenu';
import MenuPill from './MenuPill';
import { usePathname } from 'next/navigation';
import { usePageTransition } from './PageTransition';
import { scrollToId } from '@/lib/scroll';

/** Narrow or short screens: the menu fills the whole screen instead of an oval. Keep in sync with globals.css. */
const COMPACT = '(max-width: 760px), (max-height: 560px)';
const MENU_BG = '#EFEEEA'; // the menu's cream, same as the page

/** Owns the open/closed state shared by the floating pill and the big oval menu. */
export default function Menu() {
  const go = usePageTransition();
  const [open, setOpen] = useState(false);
  const pillRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);
  const artLRef = useRef<SVGSVGElement>(null);
  const artRRef = useRef<SVGSVGElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);
  const navigateRef = useRef<(href: string) => void>(() => {});
  const goRef = useRef(go);
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  useLayoutEffect(() => {
    goRef.current = go;
    pathRef.current = pathname;
  }, [go, pathname]);

  useEffect(() => {
    const pill = pillRef.current, btn = btnRef.current, label = labelRef.current, menu = menuRef.current;
    const artL = artLRef.current, artR = artRRef.current, contact = contactRef.current, scrim = scrimRef.current;
    if (!pill || !btn || !label || !menu || !artL || !artR || !contact || !scrim) return;
    const root = document.documentElement;
    const spans = menu.querySelectorAll('.nlinks a span');
    const linkEls = Array.from(menu.querySelectorAll<HTMLAnchorElement>('.nlinks a'));
    let isOpen = false;
    let navigating = false; // a menu link was clicked and its page transition is running
    let bmTween: gsap.core.Tween | null = null;
    let resetLinks = () => {};
    const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches && !prefersReducedMotion();

    // closed = the pill's exact rectangle; open = an oval inset 4vh / 3vw, or the whole screen
    // on narrow or short screens (same breakpoint as the "compact" menu CSS)
    const isCompact = () => window.matchMedia(COMPACT).matches;
    const pillClip = () => {
      const r = pill.getBoundingClientRect();
      return `inset(${r.top}px ${innerWidth - r.right}px ${innerHeight - r.bottom}px ${r.left}px round ${Math.round(r.height / 2)}px)`;
    };
    const openClip = () => {
      if (isCompact()) return 'inset(0px 0px 0px 0px round 0px)';
      const my = Math.round(innerHeight * 0.04), mx = Math.round(innerWidth * 0.03);
      return `inset(${my}px ${mx}px ${my}px ${mx}px round ${Math.round(innerHeight / 2)}px)`;
    };
    // like an app: the phone's status bar takes the menu's cream while it fills the screen
    const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const themeDefault = themeMeta?.content ?? '';
    const setTheme = () => {
      if (themeMeta) themeMeta.content = isOpen && isCompact() ? MENU_BG : themeDefault;
    };
    // the line art at the sides: every line sews itself in when the menu opens (pathLength 1,
    // stroke-dashoffset 1 -> 0); the stitched lines fade in
    const artLines = [artL, artR].flatMap((svg) => Array.from(svg.querySelectorAll<SVGElement>('.d')));
    const artStitches = [artL, artR].flatMap((svg) => Array.from(svg.querySelectorAll<SVGElement>('.st')));
    const sewArt = () => {
      gsap.fromTo(artLines, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.3, stagger: 0.007, delay: 0.35, ease: 'power2.inOut' });
      gsap.fromTo(artStitches, { opacity: 0 }, { opacity: 1, duration: 1, delay: 0.9, ease: 'sine.inOut' });
    };
    const showArt = () => {
      gsap.set(artLines, { strokeDashoffset: 0 });
      gsap.set(artStitches, { opacity: 1 });
    };
    const stopArt = () => gsap.killTweensOf([...artLines, ...artStitches]);
    // the page behind the menu can't be tabbed into or clicked while it is open
    const setInert = (on: boolean) => {
      document.querySelectorAll('main, footer').forEach((el) => el.toggleAttribute('inert', on));
    };

    // the dark blurred backdrop behind the oval (clicks on it land outside the menu, so
    // onDocClick closes it); off at once when the transition cover has hidden everything
    const setScrim = (on: boolean, instant = false) => {
      if (instant) scrim.style.transition = 'none';
      scrim.classList.toggle('on', on);
      if (instant) {
        void scrim.offsetWidth;
        scrim.style.transition = '';
      }
    };

    function setPanel(next: boolean) {
      if (next === isOpen || !menu || !btn) return;
      isOpen = next;
      setOpen(next);
      setScrim(next);
      root.style.overflow = next ? 'hidden' : '';
      setInert(next);
      setTheme();
      const calm = prefersReducedMotion();
      bmTween?.kill();
      if (next) {
        menu.hidden = false;
        if (calm) {
          showArt();
          menu.style.clipPath = openClip();
          return;
        }
        // same order as the reference: the oval starts growing, then the art is drawn
        bmTween = gsap.fromTo(menu, { clipPath: pillClip() }, { clipPath: openClip(), duration: 1.1, ease: 'expo.inOut' });
        sewArt();
        gsap.fromTo(spans, { yPercent: 110 }, { yPercent: 0, duration: 1.2, stagger: 0.07, delay: 0.45, ease: 'expo.out' });
        gsap.fromTo(contact, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1.1, delay: 0.8, ease: 'expo.out' });
      } else {
        resetLinks();
        if (menu.contains(document.activeElement)) btn.focus({ preventScroll: true });
        if (calm) {
          menu.hidden = true;
          menu.style.clipPath = '';
          stopArt();
          return;
        }
        bmTween = gsap.fromTo(menu, { clipPath: openClip() }, {
          clipPath: pillClip(), duration: 0.9, ease: 'expo.inOut',
          onComplete: () => { menu.hidden = true; gsap.set(menu, { clearProps: 'clipPath' }); stopArt(); },
        });
      }
    }
    // Under the fully maroon transition cover: close the menu instantly and reset it for next time.
    function closeInstant() {
      bmTween?.kill();
      bmTween = null;
      stopArt();
      gsap.killTweensOf([...linkEls, contact], 'opacity,y');
      gsap.killTweensOf([pill, artL, artR], 'opacity');
      if (menu && btn && menu.contains(document.activeElement)) btn.focus({ preventScroll: true });
      isOpen = false;
      navigating = false;
      setOpen(false);
      setScrim(false, true);
      root.style.overflow = '';
      setInert(false);
      setTheme();
      if (menu) {
        menu.hidden = true;
        gsap.set(menu, { clearProps: 'clipPath' });
      }
      gsap.set(linkEls, { opacity: 1 });
      gsap.set(contact, { opacity: 1, y: 0 });
      gsap.set(pill, { opacity: 1 });
      gsap.set([artL, artR], { clearProps: 'opacity' }); // back to the CSS opacity (0.4 on phones)
    }

    // A menu link was clicked: the menu fills the screen with its cream, the names and the line art
    // fade away, and the page transition draws its maroon wheel on the plain cream.
    function navigate(href: string) {
      if (navigating || !isOpen || !menu) return;
      // the page you're already on: no transition, the menu just closes
      if (href === pathRef.current) {
        setPanel(false);
        return;
      }
      // a section of the page you're on (Shop on the home page): close the menu and glide down
      // to it, once the smooth scroller has resumed
      const [path, hash] = href.split('#');
      if (hash && !href.startsWith('mailto:') && (path || pathRef.current) === pathRef.current) {
        setPanel(false);
        window.setTimeout(() => scrollToId(hash), 0);
        return;
      }
      const opts = { variant: 'menu' as const, onCovered: closeInstant };
      if (prefersReducedMotion()) {
        goRef.current(href, undefined, undefined, opts);
        return;
      }
      navigating = true;
      resetLinks();
      bmTween?.kill();
      bmTween = gsap.fromTo(menu, { clipPath: openClip() }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: 0.85, ease: 'expo.inOut' });
      gsap.to(pill, { opacity: 0, duration: 0.45, ease: 'sine.inOut' });
      gsap.to(linkEls, { opacity: 0, duration: 0.55, stagger: 0.04, delay: 0.3, ease: 'power2.inOut' });
      gsap.to(contact, { opacity: 0, duration: 0.55, delay: 0.3, ease: 'power2.inOut' });
      gsap.to([artL, artR], { opacity: 0, duration: 0.55, delay: 0.3, ease: 'power2.inOut' });
      if (!goRef.current(href, undefined, undefined, opts)) closeInstant();
    }
    navigateRef.current = navigate;

    const onBtn = (e: MouseEvent) => {
      if (navigating) return;
      setPanel(!isOpen);
      // opened from the keyboard: put focus on the first link
      if (isOpen && e.detail === 0) menu.querySelector('a')?.focus({ preventScroll: true });
    };
    // close on a click outside the menu and the pill (around the oval's curved edges)
    const onDocClick = (e: MouseEvent) => {
      if (!isOpen || navigating) return;
      const target = e.target as Node;
      if (pill.contains(target) || menu.contains(target)) return;
      e.preventDefault();
      setPanel(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !navigating) {
        setPanel(false);
        btn.focus({ preventScroll: true });
      }
    };
    const onResize = () => {
      if (!isOpen || navigating) return;
      menu.style.clipPath = openClip();
      setTheme();
    };
    btn.addEventListener('click', onBtn);
    document.addEventListener('click', onDocClick, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);

    // magnetic: the pill leans toward a nearby mouse pointer
    let unmagnet = () => {};
    if (canHover) {
      gsap.set(pill, { xPercent: -50, x: 0, y: 0 });
      const opts = { duration: 1, ease: 'expo.out' };
      const px = gsap.quickTo(pill, 'x', opts), py = gsap.quickTo(pill, 'y', opts);
      const lx = gsap.quickTo(label, 'x', opts), ly = gsap.quickTo(label, 'y', opts);
      const rest = () => { px(0); py(0); lx(0); ly(0); };
      const onMove = (e: PointerEvent) => {
        if (isOpen) return rest();
        const r = pill.getBoundingClientRect();
        const cx = r.left + r.width / 2 - Number(gsap.getProperty(pill, 'x'));
        const cy = r.top + r.height / 2 - Number(gsap.getProperty(pill, 'y'));
        const dx = e.clientX - cx, dy = e.clientY - cy;
        if (Math.hypot(dx, dy) < 170) { px(dx * 0.35); py(dy * 0.35); lx(dx * 0.12); ly(dy * 0.12); }
        else rest();
      };
      window.addEventListener('pointermove', onMove);
      root.addEventListener('pointerleave', rest);
      unmagnet = () => {
        window.removeEventListener('pointermove', onMove);
        root.removeEventListener('pointerleave', rest);
        gsap.killTweensOf([pill, label]);
        gsap.set([pill, label], { clearProps: 'transform' });
      };
    }

    // menu links: barely sticky, and a touch bigger, while hovered
    let unhover = () => {};
    if (canHover) {
      const LEAN_X = 0.08, LEAN_Y = 0.16, GROW = 1.05;
      const opts = { duration: 0.9, ease: 'expo.out' };
      const links = Array.from(menu.querySelectorAll<HTMLAnchorElement>('.nlinks a')).map((a) => {
        const qx = gsap.quickTo(a, 'x', opts), qy = gsap.quickTo(a, 'y', opts);
        const grow = (s: number) => gsap.to(a, { scale: s, duration: 0.7, ease: 'expo.out', overwrite: 'auto' });
        const enter = () => grow(GROW);
        const move = (e: PointerEvent) => {
          const r = a.getBoundingClientRect();
          const cx = r.left + r.width / 2 - Number(gsap.getProperty(a, 'x'));
          const cy = r.top + r.height / 2 - Number(gsap.getProperty(a, 'y'));
          qx((e.clientX - cx) * LEAN_X);
          qy((e.clientY - cy) * LEAN_Y);
        };
        const leave = () => { qx(0); qy(0); grow(1); };
        a.addEventListener('pointerenter', enter);
        a.addEventListener('pointermove', move);
        a.addEventListener('pointerleave', leave);
        return { a, enter, move, leave };
      });
      resetLinks = () => links.forEach((l) => l.leave());
      unhover = () => {
        links.forEach(({ a, enter, move, leave }) => {
          a.removeEventListener('pointerenter', enter);
          a.removeEventListener('pointermove', move);
          a.removeEventListener('pointerleave', leave);
        });
        gsap.killTweensOf(links.map((l) => l.a));
        gsap.set(links.map((l) => l.a), { clearProps: 'transform' });
      };
    }

    return () => {
      btn.removeEventListener('click', onBtn);
      document.removeEventListener('click', onDocClick, true);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      unmagnet();
      unhover();
      bmTween?.kill();
      stopArt();
      if (isOpen) {
        setScrim(false, true);
        root.style.overflow = '';
        setInert(false);
        menu.hidden = true;
      }
      if (themeMeta) themeMeta.content = themeDefault;
      navigateRef.current = () => {};
    };
  }, []);

  const onLink = useCallback((e: ReactMouseEvent<HTMLAnchorElement>, href: string) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    navigateRef.current(href);
  }, []);

  return (
    <>
      <BigMenu menuRef={menuRef} scrimRef={scrimRef} artLRef={artLRef} artRRef={artRRef} contactRef={contactRef} current={pathname} onLink={onLink} />
      <MenuPill open={open} pillRef={pillRef} btnRef={btnRef} labelRef={labelRef} />
    </>
  );
}
