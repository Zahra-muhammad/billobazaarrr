import type { Ref } from 'react';
import { site } from '@/data/site';

type Props = {
  open: boolean;
  pillRef: Ref<HTMLDivElement>;
  btnRef: Ref<HTMLButtonElement>;
  labelRef: Ref<HTMLSpanElement>;
};

/**
 * The frosted pill at the bottom centre: the word MENU, which turns into an X while the menu
 * is open. Both sit in the same grid cell, so the pill keeps its width.
 */
export default function MenuPill({ open, pillRef, btnRef, labelRef }: Props) {
  return (
    <div className={open ? 'pill open' : 'pill'} ref={pillRef}>
      <button
        type="button"
        className="pillbtn"
        ref={btnRef}
        aria-expanded={open}
        aria-controls="bigmenu"
        aria-label={open ? site.menu.close : undefined}
      >
        <span className="pilllabel" ref={labelRef}>
          <span className="pilltext">{site.menu.open}</span>
          <svg className="pillx" viewBox="0 0 14 14" aria-hidden="true">
            <path d="M1.5 1.5l11 11M12.5 1.5l-11 11" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" />
          </svg>
        </span>
      </button>
    </div>
  );
}
