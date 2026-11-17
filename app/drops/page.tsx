import type { Metadata } from 'next';
import PlaceholderPage, { pageTitle } from '@/components/PlaceholderPage';

export const metadata: Metadata = { title: pageTitle('drops') };

export default function Page() {
  return <PlaceholderPage page="drops" />;
}
