// Legacy /{slug}/become-agent — kept only so old share links / inbound
// emails don't 404. The old sub-agent application flow (with its own
// password + SubAgentUser record) has been retired on DataBundle;
// everyone creates a store via /start-selling using their existing
// customer account — same login, no new password.

'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyBecomeAgentRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/start-selling');
  }, [router]);
  return null;
}
