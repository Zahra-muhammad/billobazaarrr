'use client';

import { useEffect, useRef, type MouseEvent, type ReactNode } from 'react';
import { prefersReducedMotion } from '@/lib/gsap';
import { site } from '@/data/site';
import { scrollToId } from '@/lib/scroll';
import { Wordmark } from './LogoSymbol';
import TransitionLink from './TransitionLink';
import { VarLine, useHeroHeadline } from './VarHeadline';

/** In-page sections glide there, other pages play the wheel transition, mailto opens mail. */
function NavLink({ href, className, children, ...rest }: { href: string; className?: string; children: ReactNode; 'aria-label'?: string }) {
  if (href.startsWith('#')) {
    const onClick = (e: MouseEvent<HTMLAnchorElement>) => { e.preventDefault(); scrollToId(href.slice(1)); };
    return <a className={className} href={href} onClick={onClick} {...rest}>{children}</a>;
  }
  if (href.startsWith('/')) return <TransitionLink className={className} href={href}>{children}</TransitionLink>;
  return <a className={className} href={href} {...rest}>{children}</a>;
}

/**
 * The home hero. The new video full-bleed in its own colours over deep maroon, under a dark
 * readability gradient, a progressive blur along the bottom and heavy moving film grain. The
 * logo sits top centre (the intro's flying wordmark lands on it). Bottom left: the two-line
 * headline (letters swell bolder near the cursor, see VarHeadline) and "Start with your sketch".
 * Right: see-through glass cards. Along the bottom: who we work with. lib/hero.ts fades the
 * .reveal blocks in after the intro; <Intro> pins this section while its card slides over it.
 */
export default function Landing() {
  const l = site.landing;
  const titleRef = useRef<HTMLHeadingElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  useHeroHeadline(titleRef);

  // start the video by hand too: some browsers skip autoplay until `muted` is set as a property
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true;
    if (prefersReducedMotion()) v.pause();
    else v.play().catch(() => {});
  }, []);

  const { how, manufacturer, exhibitions } = l.cards;

  return (
    <section className="hero landing" id="top">
      <video className="hvid" ref={videoRef} muted loop playsInline autoPlay preload="auto" aria-hidden="true">
        <source src={l.videoSrc} type="video/mp4" />
      </video>
      <div className="hscrim" aria-hidden="true" />
      <div className="hblur" aria-hidden="true" />
      <svg className="hgrain" aria-hidden="true">
        <filter id="hgrainF">
          <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves={3} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncR type="linear" slope={1.8} intercept={-0.4} />
            <feFuncG type="linear" slope={1.8} intercept={-0.4} />
            <feFuncB type="linear" slope={1.8} intercept={-0.4} />
          </feComponentTransfer>
        </filter>
        <rect width="100%" height="100%" filter="url(#hgrainF)" />
      </svg>

      <NavLink className="mark" href="#top" aria-label={site.name}>
        <Wordmark aria-hidden="true" />
      </NavLink>

      <div className="hstack">
        <h1 className="hvar reveal" ref={titleRef} aria-label={l.lines.join(' ')}>
          <VarLine className="l1" text={l.lines[0]} />
          <VarLine className="l2" text={l.lines[1]} />
        </h1>
        {/* at rest a peach pill + a dark arrow circle; on hover the pill wraps round the circle
            and the arrow slides up and out as a new one slides in */}
        <div className="hlinks reveal">
          <a className="dpill" href={l.cta.href}>
            <span>{l.cta.label}</span>
            <i aria-hidden="true">
              <b>→</b>
              <b>→</b>
            </i>
          </a>
        </div>
      </div>

      <div className="hcards reveal">
        <NavLink className="hc pillc" href={how.href}>
          {how.label} <i aria-hidden="true">→</i>
        </NavLink>
        <NavLink className="hc imgc" href={exhibitions.href}>
          <i className="ph2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={exhibitions.img} alt="" style={{ objectPosition: exhibitions.pos }} />
          </i>
          <span>{exhibitions.label}</span>
        </NavLink>
        <NavLink className="hc imgc thumbc" href={manufacturer.href}>
          <i className="ph2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={manufacturer.img} alt="" style={{ objectPosition: manufacturer.pos }} />
          </i>
          <span>{manufacturer.label}</span>
        </NavLink>
      </div>

      <div className="hsteps reveal" role="group" aria-label={l.rowLabel}>
        {l.row.map((item) => (
          <NavLink key={item.label} href={item.href}>
            <i className="hph">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.img} alt="" style={{ objectPosition: item.pos }} />
            </i>
            <span>
              <b>{item.label}</b>
              {item.text}
            </span>
          </NavLink>
        ))}
        <i className="hfill" aria-hidden="true" />
      </div>
    </section>
  );
}
