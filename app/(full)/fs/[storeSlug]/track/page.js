'use client';

/**
 * Guest order tracker.
 *
 * Existing flow: Paystack redirects post-purchase guests to
 * /guest/return?ref=GST-XXX which is already a permanent, idempotent
 * status page. The problem is guests who close the tab can't find
 * that URL again — they have a reference but nowhere to type it.
 *
 * This page is that "type it in" entry point. Submit just hands off
 * to /guest/return, which already polls + shows delivery state.
 */

import { Suspense, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Search, ArrowRight, Receipt } from 'lucide-react';
import { storeHref } from '@/lib/fullstore/links';

function TrackInner() {
  const { storeSlug } = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const initial = search.get('ref') || '';
  const [ref, setRef] = useState(initial);
  const [error, setError] = useState('');

  const submit = (e) => {
    e?.preventDefault?.();
    const clean = String(ref || '').trim().toUpperCase();
    // We accept anything that looks like our reference shape (GST-...)
    // or even raw payment-gateway refs — the return page handles both.
    if (clean.length < 6) {
      setError('Enter the reference code from your payment receipt.');
      return;
    }
    setError('');
    router.push(storeHref(storeSlug, `/guest/return?ref=${encodeURIComponent(clean)}`));
  };

  return (
    <div className="max-w-md mx-auto px-5 py-12 sm:py-16">
      <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-faint)] font-semibold mb-2 flex items-center gap-1.5">
        <Receipt className="w-3.5 h-3.5" /> Track an order
      </div>
      <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-2">
        Where's my bundle?
      </h1>
      <p className="text-[14px] text-[color:var(--ink-mute)] mb-7">
        Paste the reference from your payment confirmation and we'll show its
        delivery status. You can also bookmark the page that opens — it stays
        live as long as the order exists.
      </p>

      <form onSubmit={submit} className="card p-5 space-y-3">
        <label className="block">
          <span className="block text-[12px] font-semibold text-[color:var(--ink-mute)] mb-1.5">
            Reference
          </span>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--ink-faint)]" />
            <input
              type="text"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder="GST-1779058982118-XXXXXX"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              className="input pl-10 font-mono text-sm tracking-wide"
            />
          </div>
        </label>

        {error && (
          <p className="text-[12px] text-[color:var(--danger)]">{error}</p>
        )}

        <button
          type="submit"
          className="w-full px-4 py-3 rounded-xl font-bold bg-[color:var(--ink)] text-[color:var(--brand)] dark:bg-[color:var(--brand)] dark:text-black hover:opacity-90 flex items-center justify-center gap-2"
        >
          Track <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-6 text-[12px] text-[color:var(--ink-faint)] space-y-1.5">
        <p>
          Can't find your reference?{' '}
          <Link href={storeHref(storeSlug, '/login')} className="font-semibold text-[color:var(--ink-mute)] hover:text-[color:var(--ink)] underline underline-offset-2">
            Sign in
          </Link>{' '}
          to see every order you've ever placed.
        </p>
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={null}>
      <TrackInner />
    </Suspense>
  );
}
