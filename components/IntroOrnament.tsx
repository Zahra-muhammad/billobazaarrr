import type { ReactNode } from 'react';

/**
 * The line-art frame behind "Your sketch, made real.": faint peach lines on the maroon, one side
 * drawn here and mirrored for the other. A Mughal arch with a dress form inside and a jhumka
 * hanging from its point; a vine of leaves climbing to a flower on the outer edge; a spool of
 * thread unwinding into a needle; scissors, buttons and small sparkles. A clothes hanger sits top
 * centre and a tape measure with a running stitch runs along the bottom.
 * Every line marked .d has pathLength 1, so <Intro> can draw it in (stroke-dashoffset 1 -> 0)
 * as the card rises, like a needle sewing it. Lines marked .st are stitches (dashed) and fade in.
 */

type P = { d: string; t?: string; st?: boolean };

/** a line that draws in (or a stitched one) */
const line = ({ d, t, st }: P, key: string | number) => (
  <path key={key} className={st ? 'st' : 'd'} pathLength={st ? undefined : 1} d={d} transform={t} />
);

const leaf = (x: number, y: number, angle: number, len: number) =>
  ({ t: `translate(${x} ${y}) rotate(${angle})`, d: `M0 0 C${len * 0.3} ${-len * 0.26} ${len * 0.72} ${-len * 0.24} ${len} 0 C${len * 0.72} ${len * 0.24} ${len * 0.3} ${len * 0.26} 0 0 Z M0 0 L${len * 0.8} 0` });

const sparkle = (x: number, y: number, s: number) =>
  ({ t: `translate(${x} ${y}) scale(${s})`, d: 'M0 -12 C1 -3 3 -1 12 0 C3 1 1 3 0 12 C-1 3 -3 1 -12 0 C-3 -1 -1 -3 0 -12 Z' });

const button = (x: number, y: number, key: string) => (
  <g key={key} transform={`translate(${x} ${y})`}>
    <circle className="d" pathLength={1} r={14} />
    <circle className="d" pathLength={1} r={10} />
    {[[-3.6, -3.6], [3.6, -3.6], [-3.6, 3.6], [3.6, 3.6]].map(([cx, cy]) => (
      <circle key={`${cx},${cy}`} className="d" pathLength={1} cx={cx} cy={cy} r={1.6} />
    ))}
  </g>
);

const flower = (x: number, y: number, key: string) => (
  <g key={key} transform={`translate(${x} ${y})`}>
    {[0, 72, 144, 216, 288].map((a) => (
      <path key={a} className="d" pathLength={1} transform={`rotate(${a})`} d="M0 -3 C-7 -9 -7 -19 0 -23 C7 -19 7 -9 0 -3 Z" />
    ))}
    <circle className="d" pathLength={1} r={3} />
  </g>
);

/** a pointed Mughal arch: legs down to the floor (y 900), springing at ys, meeting at the apex ya */
const arch = (cx: number, w: number, ys: number, ya: number) => {
  const h = ys - ya;
  return `M${cx - w} 900 L${cx - w} ${ys} C${cx - w} ${ys - 0.55 * h} ${cx - 0.2 * w} ${ya + 0.28 * h} ${cx} ${ya} C${cx + 0.2 * w} ${ya + 0.28 * h} ${cx + w} ${ys - 0.55 * h} ${cx + w} ${ys} L${cx + w} 900`;
};

// the vine: a stem up the outer edge, leaves alternating sides, a flower on top
const STEM = 'M60 900 C78 800 44 720 62 620 C80 520 46 440 64 340 C76 270 58 200 70 120 C73 96 69 78 70 64';
const LEAVES: [number, number, number][] = [
  [61, 850, -40], [58, 790, -140], [60, 700, -35], [66, 630, -145], [70, 560, -38], [60, 480, -142],
  [57, 410, -36], [63, 340, -146], [70, 270, -40], [66, 200, -140], [69, 140, -45],
];

// the dress form, centred in the arch
const FORM: P[] = [
  { d: 'M255 430 C255 442 252 448 240 450 C220 453 210 462 208 478 C206 500 210 515 214 530 C220 550 226 565 225 578 C223 600 210 620 208 645 L210 680 L330 680 L332 645 C330 620 317 600 315 578 C314 565 320 550 326 530 C330 515 334 500 332 478 C330 462 320 453 300 450 C288 448 285 442 285 430 Z' },
  { d: 'M258 430 L258 418 L282 418 L282 430' },
  { d: 'M270 450 C266 500 274 570 270 680' },
  { d: 'M225 578 Q270 592 315 578', st: true },
  { d: 'M270 680 L270 850 M270 850 L232 892 M270 850 L308 892 M270 850 L270 896' },
];

// the jhumka hanging from the inner arch's point
const JHUMKA: P[] = [
  { d: 'M270 206 L270 248' },
  { d: 'M252 286 C254 266 286 266 288 286 Z' },
  { d: 'M258 286 C262 277 278 277 282 286' },
];

// a spool of thread, its thread looping down into a needle
const SPOOL: P[] = [
  { d: 'M444 253 L444 337 M496 253 L496 337' },
  ...[0, 1, 2, 3, 4].map((k) => ({ d: `M444 ${268 + 12 * k} L496 ${276 + 12 * k}` })),
  { d: 'M496 300 C548 318 552 382 510 402 C468 422 466 462 504 472 C534 480 532 500 519 512' },
  { d: 'M520 504 C524 504 526 510 525 516 L511 616 L508 616 L516 516 C515 510 516 504 520 504 Z M519 509 L518 519' },
];

// open scissors
const SCISSORS: P[] = [
  { d: 'M470 792 L479 765 L520 684 L486 768 Z' },
  { d: 'M494 792 L485 765 L444 684 L478 768 Z' },
];

/** One side panel of the line art (also drawn in the menu, components/BigMenu.tsx). */
export function OrnamentSide() {
  return (
    <>
      {line({ d: STEM }, 'stem')}
      {LEAVES.map(([x, y, a], i) => line(leaf(x, y, a, 44), `leaf${i}`))}
      {flower(70, 42, 'fl')}

      {[[150, 360, 150], [132, 372, 176], [114, 384, 202]].map(([w, ys, ya], i) => line({ d: arch(270, w, ys, ya) }, `arch${i}`))}
      {line({ d: arch(270, 168, 348, 124), st: true }, 'archStitch')}
      {line({ d: 'M270 150 C258 138 262 122 270 114 C278 122 282 138 270 150 Z M270 114 L270 100' }, 'finial')}

      {FORM.map(line)}
      <circle className="d" pathLength={1} cx={270} cy={411} r={6} />
      <circle className="d" pathLength={1} cx={232} cy={892} r={3} />
      <circle className="d" pathLength={1} cx={308} cy={892} r={3} />

      {JHUMKA.map((p, i) => line(p, `j${i}`))}
      <circle className="d" pathLength={1} cx={270} cy={254} r={6} />
      {[256, 263, 270, 277, 284].map((x) => <circle key={`jd${x}`} className="d" pathLength={1} cx={x} cy={294} r={2} />)}

      <ellipse className="d" pathLength={1} cx={470} cy={250} rx={34} ry={9} />
      <ellipse className="d" pathLength={1} cx={470} cy={340} rx={34} ry={9} />
      <ellipse className="d" pathLength={1} cx={470} cy={250} rx={6} ry={2} />
      {SPOOL.map((p, i) => line(p, `s${i}`))}

      {SCISSORS.map((p, i) => line(p, `sc${i}`))}
      <ellipse className="d" pathLength={1} cx={462} cy={806} rx={15} ry={11} transform="rotate(-25 462 806)" />
      <ellipse className="d" pathLength={1} cx={502} cy={806} rx={15} ry={11} transform="rotate(25 502 806)" />
      <circle className="d" pathLength={1} cx={482} cy={764} r={3} />

      {button(512, 150, 'b1')}
      {button(530, 662, 'b2')}
      {([[150, 118, 1], [410, 96, 0.8], [546, 440, 0.6], [200, 304, 0.55], [430, 882, 0.7], [120, 46, 0.6]] as const).map(([x, y, s], i) => line(sparkle(x, y, s), `sp${i}`))}
    </>
  );
}

export default function IntroOrnament(): ReactNode {
  return (
    <div className="orn" aria-hidden="true">
      <svg className="orn-side l" viewBox="0 0 560 900" preserveAspectRatio="xMinYMid meet"><OrnamentSide /></svg>
      <svg className="orn-side r" viewBox="0 0 560 900" preserveAspectRatio="xMinYMid meet"><OrnamentSide /></svg>
      {/* a clothes hanger, top centre */}
      <svg className="orn-top" viewBox="0 0 200 92">
        <path className="d" pathLength={1} d="M100 30 C100 22 98 16 104 12 C110 8 114 2 108 -2 C102 -6 94 -2 96 6" transform="translate(0 6)" />
        <path className="d" pathLength={1} d="M100 36 L22 74 C14 78 16 86 24 86 L176 86 C184 86 186 78 178 74 Z" />
        <path className="d" pathLength={1} transform="translate(36 34) scale(0.55)" d="M0 -12 C1 -3 3 -1 12 0 C3 1 1 3 0 12 C-1 3 -3 1 -12 0 C-3 -1 -1 -3 0 -12 Z" />
        <path className="d" pathLength={1} transform="translate(164 34) scale(0.55)" d="M0 -12 C1 -3 3 -1 12 0 C3 1 1 3 0 12 C-1 3 -3 1 -12 0 C-3 -1 -1 -3 0 -12 Z" />
      </svg>
      {/* a tape measure along the bottom edge, with a running stitch above it */}
      <svg className="orn-tape" preserveAspectRatio="none">
        <defs>
          <pattern id="ornTicks" width="40" height="30" patternUnits="userSpaceOnUse">
            <path d="M0.5 10 L0.5 24 M8.5 10 L8.5 16 M16.5 10 L16.5 16 M20.5 10 L20.5 19 M24.5 10 L24.5 16 M32.5 10 L32.5 16" />
          </pattern>
        </defs>
        <line className="st" x1="0" y1="2" x2="100%" y2="2" />
        <line x1="0" y1="10" x2="100%" y2="10" />
        <line x1="0" y1="29" x2="100%" y2="29" />
        <rect className="ticks" x="0" y="0" width="100%" height="30" fill="url(#ornTicks)" />
      </svg>
    </div>
  );
}
