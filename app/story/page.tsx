import type { Metadata } from 'next';
import About from '@/components/About';
import { site } from '@/data/site';

export const metadata: Metadata = { title: site.about.title };

export default function Page() {
  return <About />;
}
