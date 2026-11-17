import type { SVGProps } from 'react';
import { LOGO_PATH_D } from './logoPath';

/** Full logo: oval, flowers, "STUDENTS TO", بلّو بازار, ".pk", "ENTREPRENEURS." */
export const FULL_LOGO_VIEWBOX = '328 623 1345 753';
/** Wordmark only (بلّو بازار + .pk): the same path, cropped by the viewBox. */
export const WORDMARK_VIEWBOX = '584 783 781 357';

/**
 * The traced logo artwork, defined once and reused everywhere with <use href="#logoPath">.
 * It is vector artwork, never a font.
 */
export default function LogoSymbol() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <path id="logoPath" pathLength={1} fillRule="evenodd" d={LOGO_PATH_D} />
      </defs>
    </svg>
  );
}

export function Wordmark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox={WORDMARK_VIEWBOX} {...props}>
      <use href="#logoPath" fill="currentColor" />
    </svg>
  );
}
