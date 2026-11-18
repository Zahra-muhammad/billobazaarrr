import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { adminCredentials, getAdmin } from '@/lib/auth';
import AdminSignInForm from '@/components/AdminSignInForm';

export const metadata: Metadata = { title: 'Admin login', robots: { index: false, follow: false } };

export default async function AdminSignInPage() {
  if (await getAdmin()) redirect('/admin');
  return <AdminSignInForm configured={!!adminCredentials()} />;
}
