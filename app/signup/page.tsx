import type { Metadata } from 'next';
import AuthForm from '@/components/AuthForm';
import { site } from '@/data/site';

export const metadata: Metadata = { title: site.auth.signup };

export default function Page() {
  return <AuthForm mode="signup" />;
}
