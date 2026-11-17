'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps, MouseEvent } from 'react';
import { usePageTransition } from './PageTransition';
import { scrollToTop } from '@/lib/scroll';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: string };

/**
 * An internal link that plays the wheel transition. On the page it points to, it just
 * jumps back to the top (like the reference's #top links).
 */
export default function TransitionLink({ href, onClick, children, ...rest }: Props) {
  const go = usePageTransition();
  const pathname = usePathname();

  function handle(e: MouseEvent<HTMLAnchorElement>) {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (href === pathname) {
      scrollToTop();
      return;
    }
    let x = e.clientX, y = e.clientY;
    if (!x && !y) {
      const r = e.currentTarget.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top + r.height / 2;
    }
    go(href, x, y);
  }

  return (
    <Link href={href} onClick={handle} {...rest}>
      {children}
    </Link>
  );
}
