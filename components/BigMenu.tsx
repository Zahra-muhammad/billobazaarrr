import type { MouseEvent, Ref } from 'react';
import { site } from '@/data/site';

type Props = {
  menuRef: Ref<HTMLDivElement>;
  scrimRef: Ref<HTMLDivElement>;
  artLRef: Ref<HTMLCanvasElement>;
  artRRef: Ref<HTMLCanvasElement>;
  contactRef: Ref<HTMLDivElement>;
  /** the current route, marked for screen readers with aria-current */
  current: string;
  onLink: (e: MouseEvent<HTMLAnchorElement>, href: string) => void;
};

/**
 * The cream oval menu that grows out of the pill, over a dark blurred scrim (so it never melts
 * into a cream section behind it). Both are driven imperatively by <Menu>: the menu stays
 * `hidden` in markup until the open animation starts, the scrim fades with its `on` class.
 * data-lenis-prevent lets the full-screen menu scroll on short screens while the smooth
 * scroller is paused.
 */
export default function BigMenu({ menuRef, scrimRef, artLRef, artRRef, contactRef, current, onLink }: Props) {
  const { links, contactLabels } = site.menu;
  return (
    <>
      <div className="bmscrim" id="bmScrim" ref={scrimRef} aria-hidden="true" />
      <div className="bigmenu" id="bigmenu" ref={menuRef} hidden data-lenis-prevent>
        <canvas className="bmart bmart-l" ref={artLRef} aria-hidden="true" />
        <canvas className="bmart bmart-r" ref={artRRef} aria-hidden="true" />
        <nav className="nlinks" aria-label="Main">
          {links.map((l) => (
            <a key={l.label} href={l.href} aria-current={l.href === current ? 'page' : undefined} onClick={(e) => onLink(e, l.href)}>
              <span>{l.label}</span>
            </a>
          ))}
        </nav>
        <div className="bmcontact" ref={contactRef}>
          <p>
            <span>{contactLabels.whatsapp}</span>
            {site.contact.whatsapp}
          </p>
          <p>
            <span>{contactLabels.email}</span>
            {site.contact.email}
          </p>
        </div>
      </div>
    </>
  );
}
