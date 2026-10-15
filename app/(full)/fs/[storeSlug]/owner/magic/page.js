'use client';

/**
 * Owner magic-link entry point.
 *
 * The DataMart agent dashboard issues a one-shot owner_magic JWT via
 * /api/v1/agent-stores/stores/:id/owner-magic-link and redirects the
 * agent here with ?token=…. We swap the token for the real owner
 * accessToken + fs_owner_refresh cookie, drop the ownership-hint
 * localStorage flag so future visits auto-bootstrap, and forward to
 * the owner dashboard.
 *
 * On any failure we land on /owner/login with a small explanation —
 * the agent can fall back to typing credentials.
 */

import { Suspense, useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { AuthShell } from '@/components/fullstore/AuthShell';
import { ownerPortal, setOwnerAccessToken } from '@/lib/fullstore/api';
import { storeHref } from '@/lib/fullstore/links';

function OwnerMagicInner() {
  const { storeSlug } = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const token = search.get('token');

  // Guard against React 18 dev-mode double-mount firing the exchange
  // twice (which would burn the jti on the first call and 409 the
  // second — same single visit, but the user would see "already used").
  const exchangedRef = useRef(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (exchangedRef.current) return;
    exchangedRef.current = true;

    if (!token) {
      router.replace(storeHref(storeSlug, '/owner/login?reason=magic_no_token'));
      return;
    }

    (async () => {
      try {
        const res = await ownerPortal.magic(storeSlug, { token });
        const accessToken = res?.data?.accessToken;
        if (accessToken) setOwnerAccessToken(accessToken);
        // Mirror the OwnerAuthProvider's localStorage hint so the next
        // page load auto-bootstraps via owner-refresh without a 401.
        if (typeof window !== 'undefined') {
          try { window.localStorage.setItem(`fs_had_owner_${storeSlug}`, '1'); } catch (_) {}
        }
        router.replace(storeHref(storeSlug, '/owner'));
      } catch (err) {
        const code = err?.code || err?.data?.code;
        // Map well-known backend codes to a redirect query the login
        // page can show as a friendly toast.
        const reason =
          code === 'ALREADY_USED' ? 'magic_used'
          : code === 'INVALID_TOKEN' ? 'magic_expired'
          : code === 'NOT_STORE_OWNER' ? 'not_owner'
          : 'magic_failed';
        setError(err?.message || 'Could not open the dashboard');
        setTimeout(() => {
          router.replace(storeHref(storeSlug, `/owner/login?reason=${reason}`));
        }, 1200);
      }
    })();
  }, [token, storeSlug, router]);

  return (
    <AuthShell>
      <div className="max-w-md mx-auto text-center py-12">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[color:var(--ink)] text-[color:var(--brand)] flex items-center justify-center mb-4">
          {error ? <ShieldCheck className="w-7 h-7" /> : <Loader2 className="w-7 h-7 animate-spin" />}
        </div>
        <h1 className="text-xl font-extrabold mb-1">
          {error ? 'Could not open dashboard' : 'Opening your dashboard…'}
        </h1>
        <p className="text-sm text-[color:var(--ink-mute)]">
          {error
            ? `${error} — sending you to login.`
            : 'Signing you in as the store owner.'}
        </p>
        {error && (
          <Link
            href={storeHref(storeSlug, '/owner/login')}
            className="inline-block mt-5 btn btn-yellow"
          >
            Go to login
          </Link>
        )}
      </div>
    </AuthShell>
  );
}

export default function OwnerMagicPage() {
  // useSearchParams() requires a Suspense boundary in Next 15.
  return (
    <Suspense fallback={null}>
      <OwnerMagicInner />
    </Suspense>
  );
}
