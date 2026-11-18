import { getCurrentUser } from '@/lib/auth';

/** Who's signed in (first name only), for the Log in / My account bar. Never cached. */
export async function GET() {
  const user = await getCurrentUser();
  return Response.json(
    { user: user ? { name: user.name.trim().split(/\s+/)[0], role: user.role } : null },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
