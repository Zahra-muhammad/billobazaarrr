import type { Metadata } from 'next';
import PlaceholderPage, { pageTitle } from '@/components/PlaceholderPage';

export const metadata: Metadata = { title: pageTitle('exhibitions') };

export default function Page() {
  return <PlaceholderPage page="exhibitions" />;
}
