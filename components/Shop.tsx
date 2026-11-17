'use client';

import { useEffect, useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { site } from '@/data/site';
import { GARMENTS } from './garments';

function Plus() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
      <path d="M7 1v12M1 7h12" />
    </svg>
  );
}

function Arrow({ dir }: { dir: -1 | 1 }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={dir < 0 ? 'M19 12H5M11 6l-6 6 6 6' : 'M5 12h14M13 6l6 6-6 6'} />
    </svg>
  );
}

/**
 * "The collection": a sideways row of product cards (thin rules between them, sketch on top,
 * name, price and designer below). Each sketch flips from the garment's front to its back on
 * hover. The row scrolls with a trackpad, by dragging with the mouse, or with the arrows.
 */
export default function Shop() {
  const s = site.shop;
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // the heading and the cards rise in as the row scrolls into view
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.shop-head > *', { y: 40, opacity: 0, duration: 1, stagger: 0.1, ease: 'power3.out', scrollTrigger: { trigger: sectionRef.current, start: 'top 80%' } });
      gsap.from('.track .card', { y: 80, opacity: 0, duration: 1.1, stagger: 0.09, ease: 'power3.out', scrollTrigger: { trigger: trackRef.current, start: 'top 85%' } });
    });
  }, { scope: sectionRef });

  // drag to scroll with the mouse (touch and trackpads scroll the row natively)
  useEffect(() => {
    const t = trackRef.current;
    if (!t) return;
    let down = false, moved = false, sx = 0, sl = 0;
    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      down = true; moved = false; sx = e.clientX; sl = t.scrollLeft;
    };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      const dx = e.clientX - sx;
      if (Math.abs(dx) > 5) { moved = true; t.classList.add('drag'); }
      t.scrollLeft = sl - dx;
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      setTimeout(() => t.classList.remove('drag'), 0);
    };
    // a drag that ends on a card is not a click
    const onClick = (e: MouseEvent) => { if (moved) { e.preventDefault(); moved = false; } };
    // the browser's own link dragging would steal the gesture
    const noNativeDrag = (e: DragEvent) => e.preventDefault();
    // sideways trackpad swipes belong to the row, not to the page's smooth scroller
    const onWheel = (e: WheelEvent) => { if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) e.stopPropagation(); };
    t.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    t.addEventListener('click', onClick, true);
    t.addEventListener('dragstart', noNativeDrag);
    t.addEventListener('wheel', onWheel, { passive: true });
    return () => {
      t.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      t.removeEventListener('click', onClick, true);
      t.removeEventListener('dragstart', noNativeDrag);
      t.removeEventListener('wheel', onWheel);
    };
  }, []);

  const step = (d: -1 | 1) => {
    const t = trackRef.current;
    if (!t) return;
    const card = t.querySelector<HTMLElement>('.card');
    t.scrollBy({ left: d * (card ? card.offsetWidth : 300), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  return (
    <section className="shop" id="shop" aria-labelledby="shopTitle" ref={sectionRef}>
      <div className="wrap shop-head">
        <div>
          <h2 id="shopTitle">
            {s.title} <em>{s.em}</em>
          </h2>
          <p className="sub">{s.sub}</p>
        </div>
        <a className="shop-all" href={s.all.href}>{s.all.label}</a>
      </div>

      <div className="track" id="shopTrack" ref={trackRef}>
        {s.items.map((item) => {
          const g = GARMENTS[item.id];
          return (
            <a key={item.id} className="card" href={s.itemHref}>
              <div className="img">
                {item.tag && <span className="tag">{item.tag}</span>}
                <span className="art">
                  {g.front}
                  {g.back}
                </span>
                <span className="side" data-front={s.front} data-back={s.back} aria-hidden="true" />
                <span className="plus"><Plus /></span>
              </div>
              <div className="meta">
                <span className="nm">{item.name}</span>
                <span className="pr">{item.price}</span>
                <span className="by">{item.by}</span>
              </div>
            </a>
          );
        })}
        <a className="card apply" href={s.apply.href}>
          <div className="img">
            <span className="big">
              {s.apply.big}
              <em>{s.apply.em}</em>
            </span>
            <span className="plus"><Plus /></span>
          </div>
          <div className="meta">
            <span className="nm">{s.apply.name}</span>
            <span className="pr">{s.apply.price}</span>
            <span className="by">{s.apply.by}</span>
          </div>
        </a>
      </div>

      <div className="wrap shop-foot">
        <p className="note">{s.note}</p>
        <div className="arrows">
          <button type="button" id="prevBtn" aria-label={s.prev} onClick={() => step(-1)}><Arrow dir={-1} /></button>
          <button type="button" id="nextBtn" aria-label={s.next} onClick={() => step(1)}><Arrow dir={1} /></button>
        </div>
      </div>
    </section>
  );
}
