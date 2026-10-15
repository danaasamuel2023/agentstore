'use client';

/**
 * Auth-aware CTA link.
 *
 * Server-rendered pages (storefront, layouts) can't know whether the
 * current visitor is signed in, so links like "Create account" or
 * "Start earning" bounce authed customers to /register or /login — a
 * confusing dead end. Wrap any such link in <CtaLink> and pass the
 * authed-state target as `authedHref`.
 *
 * While auth status is still loading (silent refresh in flight), we
 * render the guest href — it's safe (worst case they see a login form
 * for a split second). Don't render the link as `disabled` during
 * loading; we don't want a flash of a non-clickable button.
 */

import Link from 'next/link';
import { useAuth } from '@/lib/fullstore/auth';

export function CtaLink({ guestHref, authedHref, guestOnly, children, ...rest }) {
  const { status } = useAuth();
  // Hide guest-only CTAs (e.g. "Register to save more") once we know the
  // visitor is signed in — they've already done the thing the CTA asks.
  if (guestOnly && status === 'authed') return null;
  const href = status === 'authed' && authedHref ? authedHref : guestHref;
  return (
    <Link href={href} {...rest}>
      {children}
    </Link>
  );
}
