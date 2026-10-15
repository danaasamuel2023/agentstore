'use client';

/**
 * Paystack redirects here after the customer pays. We re-verify with the
 * backend (which also calls Paystack to confirm) so we don't rely on the
 * webhook having landed yet. If it succeeded, send the customer to their
 * wallet. If it failed, show a clean error with a retry path.
 */

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { storePortal } from '@/lib/fullstore/api';
import { formatGhs } from '@/lib/fullstore/format';
import { storeHref } from '@/lib/fullstore/links';

function ReturnInner() {
  const { storeSlug } = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const ref = search.get('reference') || search.get('ref') || search.get('trxref');

  const [phase, setPhase] = useState('checking'); // checking | success | failed
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ref) { setPhase('failed'); setError('Missing payment reference'); return; }
    let stopped = false;
    (async () => {
      // Try a refresh first so we're authenticated for the verify call.
      try { await storePortal.refresh(storeSlug); } catch (_) {}
      try {
        const res = await storePortal.verifyDeposit(storeSlug, ref);
        if (stopped) return;
        const dep = res?.data?.deposit;
        const status = dep?.status;
        if (status === 'completed') {
          setData(res.data);
          setPhase('success');
          // Briefly show success then send them to wallet.
          setTimeout(() => router.push(storeHref(storeSlug, '/account/wallet')), 1800);
        } else if (status === 'failed' || status === 'refunded') {
          setPhase('failed');
          setError(dep?.failureReason || 'Payment did not complete.');
        } else {
          // Still pending — tell them to wait and check wallet shortly.
          setData(res.data);
          setPhase('pending');
        }
      } catch (err) {
        if (!stopped) {
          setPhase('failed');
          setError(err.message || 'Could not verify the payment.');
        }
      }
    })();
    return () => { stopped = true; };
  }, [ref, storeSlug, router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-5">
      <div className="card p-8 sm:p-10 max-w-md w-full text-center">
        {phase === 'checking' && (
          <>
            <Loader2 className="w-10 h-10 mx-auto animate-spin text-[color:var(--ink-faint)]" />
            <h2 className="text-xl font-extrabold mt-4">Confirming your payment…</h2>
            <p className="text-[13px] text-[color:var(--ink-mute)] mt-1">This usually takes a few seconds.</p>
          </>
        )}

        {phase === 'success' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-[color:var(--success)]/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-[color:var(--success)]" />
            </div>
            <h2 className="text-2xl font-black mt-4">Deposit confirmed</h2>
            {data?.deposit && (
              <p className="text-[14px] text-[color:var(--ink-mute)] mt-1">
                {formatGhs(data.deposit.requestedAmount)} added to your wallet.
              </p>
            )}
            <p className="text-[12px] text-[color:var(--ink-faint)] mt-3">Taking you to your wallet…</p>
          </>
        )}

        {phase === 'pending' && (
          <>
            <Loader2 className="w-10 h-10 mx-auto animate-spin text-[color:var(--brand-deep)]" />
            <h2 className="text-xl font-extrabold mt-4">Still processing</h2>
            <p className="text-[13px] text-[color:var(--ink-mute)] mt-1">
              Paystack hasn't confirmed yet. We'll credit your wallet as soon as they do — feel free to close this page.
            </p>
            <Link href={storeHref(storeSlug, '/account/wallet')} className="btn btn-primary mt-5">
              Go to wallet <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        )}

        {phase === 'failed' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
              <XCircle className="w-7 h-7 text-[color:var(--danger)]" />
            </div>
            <h2 className="text-2xl font-black mt-4">Payment didn't complete</h2>
            <p className="text-[13px] text-[color:var(--ink-mute)] mt-1">{error}</p>
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              <Link href={storeHref(storeSlug, '/account/wallet/deposit')} className="btn btn-primary">Try again</Link>
              <Link href={storeHref(storeSlug, '/account')} className="btn btn-ghost">Back to account</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function DepositReturnPage() {
  return (
    <Suspense fallback={null}>
      <ReturnInner />
    </Suspense>
  );
}
