import type { Metadata } from 'next';
import Join from '@/components/Join';
import { site } from '@/data/site';

export const metadata: Metadata = { title: site.join.title };

export default function Page() {
  return <Join />;
}
