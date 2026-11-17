import Hero from './Hero';
import { site } from '@/data/site';

export type PageKey = keyof typeof site.pages;

/** The menu routes: a centred heading in the same hero style, until real content exists. */
export default function PlaceholderPage({ page }: { page: PageKey }) {
  const p = site.pages[page];
  return <Hero title={p.title} em={p.em} lede={p.lede} />;
}

export const pageTitle = (page: PageKey) => site.pages[page].label;
