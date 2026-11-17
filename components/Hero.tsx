'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap, useGSAP } from '@/lib/gsap';
import { site } from '@/data/site';

type Props = {
  title: string;
  em: string;
  lede?: string;
};

/**
 * The inner pages' hero (the home page has <Landing>): full-bleed black-and-white video with a
 * soft maroon tint, vignette, moving film grain and a slow zoom, and the headline bottom left
 * on two lines (the title's words, then its last word with the script accent). Each line rises
 * out of its own mask; lib/hero.ts plays that entrance for the intro and the page transition.
 */
export default function Hero({ title, em, lede }: Props) {
  const h = site.hero;
  const sectionRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const words = title.split(' ');
  const lead = words.slice(0, -1).join(' ');
  const last = words[words.length - 1];

  // hide the placeholder note once the video is actually playing
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlaying = () => setPlaying(true);
    v.addEventListener('playing', onPlaying);
    v.muted = true;
    if (!v.paused && v.readyState > 2) onPlaying();
    else v.play().catch(() => {});
    return () => v.removeEventListener('playing', onPlaying);
  }, []);

  // scrolling: the video drifts slower than the page, the headline lifts away
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const trigger = sectionRef.current;
      gsap.to(mediaRef.current, { yPercent: 10, ease: 'none', scrollTrigger: { trigger, start: 'top top', end: 'bottom top', scrub: 1 } });
      gsap.to(contentRef.current, { yPercent: -18, opacity: 0.2, ease: 'none', scrollTrigger: { trigger, start: 'top top', end: 'bottom top', scrub: 1 } });
    });
  }, { scope: sectionRef });

  return (
    <section className="hero" id="top" ref={sectionRef}>
      <div className="hero-media" ref={mediaRef} aria-hidden="true">
        <video ref={videoRef} autoPlay muted loop playsInline preload="auto">
          <source src={h.videoSrc} type="video/mp4" />
        </video>
      </div>
      <div className="hero-tint hero-tint-1" aria-hidden="true" />
      <div className="hero-tint hero-tint-2" aria-hidden="true" />
      <div className="hero-vignette" aria-hidden="true" />
      <div className="hero-grain" aria-hidden="true" />
      {!playing && <p className="vidnote mono">{h.videoNote}</p>}

      <div className="hero-content" ref={contentRef}>
        <h1>
          {lead && (
            <span className="hl">
              <span className="hl-in">{lead}</span>
            </span>
          )}
          <span className="hl">
            <span className="hl-in">
              {last} <em>{em}</em>
            </span>
          </span>
        </h1>
        {lede && <p className="lede reveal">{lede}</p>}
      </div>
    </section>
  );
}
