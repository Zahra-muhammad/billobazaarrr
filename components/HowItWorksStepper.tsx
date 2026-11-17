'use client';

import { useRef } from 'react';
import { gsap, ScrollTrigger, useGSAP, prefersReducedMotion } from '@/lib/gsap';
import { site } from '@/data/site';

/**
 * The pinned "How it works" stepper. Left: the numbered list (current step lit), a big thin
 * number whose digit rolls to the next, and the current step's tags, title and text. Right: the
 * sewing video low in the background, and one photo card per step: each floats up from below
 * with a slight tilt, straightens and rests in the middle, then floats up and away as the next
 * rises. Card positions are worked out from the scroll position every frame (with a smooth lag),
 * so a card can never get stuck in the wrong place. Reduced motion: a plain stacked list.
 */
export default function HowItWorksStepper({ have }: { have: boolean[] }) {
  const s = site.how;
  const ref = useRef<HTMLElement>(null);
  const rollRef = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    const px = ref.current, roll = rollRef.current;
    if (!px || !roll) return;
    if (prefersReducedMotion()) {
      px.classList.add('flat');
      return () => px.classList.remove('flat');
    }
    const steps = gsap.utils.toArray<HTMLElement>('.stepx', px);
    const frames = gsap.utils.toArray<HTMLElement>('.frames .ph', px);
    const items = gsap.utils.toArray<HTMLElement>('ol li', px);
    const n = frames.length;

    gsap.set(steps, { autoAlpha: 0, y: 40 });
    gsap.set(steps[0], { autoAlpha: 1, y: 0 });

    // the step texts all sit in the same spot, so they take turns: the old one is fully gone
    // (0.3s) before the new one rises in, and two are never shown at once
    const OUT = 0.4;
    let cur = 0;
    const go = (i: number) => {
      if (i === cur) return;
      const prev = cur;
      cur = i;
      items.forEach((li, k) => li.classList.toggle('on', k === i));
      gsap.to(roll, { yPercent: (-100 / n) * i, duration: 1.3, ease: 'expo.inOut', overwrite: true });
      // scrolling fast past several steps: any other step still fading out goes at once
      steps.forEach((s, k) => {
        if (k !== i && k !== prev) gsap.set(s, { autoAlpha: 0, overwrite: true });
      });
      gsap.to(steps[prev], { autoAlpha: 0, y: i > prev ? -30 : 30, duration: OUT, ease: 'power2.inOut', overwrite: true });
      gsap.fromTo(steps[i], { autoAlpha: 0, y: i > prev ? 40 : -40 }, { autoAlpha: 1, y: 0, duration: 1.2, delay: OUT, ease: 'expo.out', overwrite: true });
    };

    // t runs from -0.25 to n - 0.75 over the pinned scroll; card k rests while t is near k
    const span = n - 1 + 0.5;
    const place = (t: number) => {
      const H = window.innerHeight * 0.85;
      frames.forEach((f, k) => {
        const d = t - k;
        let y = 0, r = 0, u: number;
        if (d < -0.15 && k > 0) { u = Math.min(1, (-d - 0.15) / 0.5); u *= u; y = H * u; r = 4 * u; }
        else if (d > 0.15 && k < n - 1) { u = Math.min(1, (d - 0.15) / 0.5); u *= u; y = -H * u; r = -4 * u; }
        gsap.set(f, { y, rotation: r, zIndex: k, visibility: Math.abs(y) >= H ? 'hidden' : 'visible' });
      });
      go(Math.max(0, Math.min(n - 1, Math.round(t))));
    };

    let target = 0;
    const st = ScrollTrigger.create({
      trigger: px, start: 'top top', end: `+=${n * 90}%`, pin: '.px .pin', anticipatePin: 1,
      onUpdate: (self) => { target = self.progress * span - 0.25; },
      onRefresh: (self) => { target = self.progress * span - 0.25; },
    });
    let smooth = (target = st.progress * span - 0.25);
    place(smooth);
    const tick = (_time: number, dt: number) => {
      if (Math.abs(target - smooth) < 0.0005) return;
      smooth += (target - smooth) * (1 - Math.pow(0.93, dt / 16.7));
      place(smooth);
    };
    gsap.ticker.add(tick);

    gsap.fromTo('.px .bg video', { yPercent: 4 }, { yPercent: -4, ease: 'none', scrollTrigger: { trigger: px, start: 'top bottom', end: 'bottom top', scrub: 1 } });
    gsap.from('.px .frames', { y: 120, opacity: 0, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: px, start: 'top 70%' } });

    return () => gsap.ticker.remove(tick);
  }, { scope: ref });

  return (
    <section className="px" id="how" aria-label={s.label} ref={ref}>
      <div className="pin">
        <figure className="bg" aria-hidden="true">
          <video muted loop playsInline autoPlay preload="metadata">
            <source src={site.hero.videoSrc} type="video/mp4" />
          </video>
        </figure>

        <div className="left">
          <div className="top">
            <ol>
              {s.steps.map((step, i) => (
                <li key={step.item} className={i === 0 ? 'on' : undefined}>
                  <b>{String(i + 1).padStart(2, '0')}</b>
                  {step.item}
                </li>
              ))}
            </ol>
            <div className="num" aria-hidden="true">
              <span>0</span>
              <span className="roll" ref={rollRef}>
                {s.steps.map((_, i) => (
                  <span key={i}>{i + 1}</span>
                ))}
              </span>
            </div>
          </div>
          <div className="bottom">
            {s.steps.map((step, i) => (
              <div className="stepx" key={step.item} data-i={i}>
                <div className="tags">
                  {step.tags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
                <h3>
                  {step.title.before} <em>{step.title.em}</em>
                  {step.title.after && ` ${step.title.after}`}
                </h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="right">
          <div className="frames">
            {s.steps.map((step, i) => (
              <figure className={have[i] ? 'ph' : 'ph is-empty'} key={step.photo.src}>
                {have[i] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={step.photo.src} alt={step.photo.alt} style={{ objectPosition: step.photo.pos }} />
                ) : (
                  <span className="ph-note" role="img" aria-label={step.photo.alt}>
                    [ Photo: {step.photo.note} ]
                  </span>
                )}
              </figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
