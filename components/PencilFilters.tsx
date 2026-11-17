/**
 * Shared hand-drawn "boil" filters. While an animation runs, a setInterval cycles the
 * turbulence seed 1 → 40 → 1 (#boil every 160ms in the loader, #boil + #boil2 every 130ms
 * in the page transition), which makes the lines jitter like pencil. #pencil-still never
 * moves: it gives the shop's garment sketches a steady hand-drawn wobble.
 */
export default function PencilFilters() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <filter id="pencil" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence id="boil" type="fractalNoise" baseFrequency="0.035" numOctaves={2} seed={1} />
        <feDisplacementMap in="SourceGraphic" scale={4} />
      </filter>
      <filter id="pencilRough" x="-20%" y="-20%" width="140%" height="140%">
        <feTurbulence id="boil2" type="fractalNoise" baseFrequency="0.03" numOctaves={2} seed={3} />
        <feDisplacementMap in="SourceGraphic" scale={6} />
      </filter>
      <filter id="pencil-still" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves={2} seed={4} />
        <feDisplacementMap in="SourceGraphic" scale={2.5} />
      </filter>
    </svg>
  );
}
