import type { Metadata } from 'next';
import PlaceholderPage, { pageTitle } from '@/components/PlaceholderPage';

export const metadata: Metadata = { title: pageTitle('designers') };

export default function Page() {
  return <PlaceholderPage page="designers" />;
}
