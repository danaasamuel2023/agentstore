// Legacy /reseller/login — kept only so old emails / bookmarks land
// somewhere sensible. The reseller dashboard now uses the customer's
// existing account; no separate login. We push them to the platform
// /login page if they're a guest, or straight to /reseller if authed.

'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyResellerLogin() {
  const router = useRouter();
  useEffect(() => {
    // Middleware unauthenticated → /login; authed → /reseller
    router.replace('/login');
  }, [router]);
  return null;
}
