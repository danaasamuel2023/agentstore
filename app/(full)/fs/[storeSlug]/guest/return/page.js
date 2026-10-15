'use client';

/**
 * Paystack redirects guests here after payment. We re-verify with the
 * backend (which calls Paystack to confirm + places the data order) so we
 * don't rely on the webhook having landed yet. The verify endpoint is
 * idempotent — replays return the same outcome.
 *
 * Phases:
 *   checking   — verifying with the backend
 *   placing    — paid, data order placed, awaiting delivery
 *   delivered  — provider confirmed delivery
 *   failed     — payment did not complete
 */

import { Suspense, useEffect, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, CheckCircle2, XCircle, ArrowRight, Clock, Smartphone
} from 'lucide-react';
import { storePortal } from '@/lib/fullstore/api';
import { formatGhs, maskPhone, NETWORK_LABEL } from '@/lib/fullstore/format';
import { storeHref } from '@/lib/fullstore/links';
import { SpinWin } from '@/components/fullstore/SpinWin';

function ReturnInner() {
  const { storeSlug } = useParams();
  const search = useSearchParams();
  const ref = search.get('reference') || search.get('ref') || search.get('trxref');

  const [phase, setPhase] = useState('checking'); // checking|placing|delivered|failed
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  // ── Step 1: verify the payment with the backend ──
  useEffect(() => {
    if (!ref) { setPhase('failed'); setError('Missing payment reference'); return; }
    let stopped = false;
    (async () => {
      try {
        const res = await storePortal.verifyGuest(storeSlug, ref);
        if (stopped) return;
        const o = res?.data?.order;
        setOrder(o || null);
        const s = o?.status;
        if (s === 'delivered') {
          setPhase('delivered');
        } else if (s === 'placed' || s === 'paid_pending_delivery') {
          setPhase('placing');
        } else if (s === 'failed' || s === 'refunded') {
          setPhase('failed');
          setError(o?.failureReason || 'Payment did not complete.');
        } else {
          // pending_payment or other — keep showing checking; webhook may catch up
          setPhase('placing');
        }
      } catch (err) {
        if (!stopped) {
          setPhase('failed');
          setError(err.message || 'Could not verify the payment.');
        }
      }
    })();
    return () => { stopped = true; };
  }, [ref, storeSlug]);

  // ── Step 2: while we're in 'placing', poll the order endpoint until
  // the data lands (status becomes 'delivered') or fails. Stop after ~3 min. ──
  useEffect(() => {
    if (phase !== 'placing' || !ref) return;
    let stopped = false;
    let attempts = 0;
    const tick = async () => {
      attempts += 1;
      try {
        const res = await storePortal.getGuestOrder(storeSlug, ref);
        if (stopped) return;
        const o = res?.data?.order;
        if (o) setOrder(o);
        const s = o?.status;
        if (s === 'delivered') {
          setPhase('delivered');
          return;
        }
        if (s === 'failed' || s === 'refunded') {
          setPhase('failed');
          setError(o?.failureReason || 'The provider could not deliver the bundle.');
          return;
        }
      } catch (_) {}
      if (attempts < 18 && !stopped) {
        pollRef.current = setTimeout(tick, 10_000); // 18 × 10s ≈ 3 min
      }
    };
    pollRef.current = setTimeout(tick, 6_000); // first poll after 6s
    return () => {
      stopped = true;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [phase, ref, storeSlug]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-5">
      <div className="card p-8 sm:p-10 max-w-md w-full text-center">
        {phase === 'checking' && (
          <>
            <Loader2 className="w-10 h-10 mx-auto animate-spin text-[color:var(--ink-faint)]" />
            <h2 className="text-xl font-extrabold mt-4">Confirming your payment…</h2>
            <p className="text-[13px] text-[color:var(--ink-mute)] mt-1">
              This usually takes a few seconds.
            </p>
          </>
        )}

        {phase === 'placing' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-[color:var(--brand-glow)] flex items-center justify-center mx-auto">
              <Clock className="w-7 h-7 text-[color:var(--brand-deep)]" />
            </div>
            <h2 className="text-2xl font-black mt-4">Payment received</h2>
            <p className="text-[13px] text-[color:var(--ink-mute)] mt-1">
              Sending {order?.capacity ? `${order.capacity}GB` : 'data'} to
              {order?.recipientPhone ? <strong> {maskPhone(order.recipientPhone)}</strong> : ' the recipient'}
              … most bundles land within 1–5 minutes.
            </p>
            {order && (
              <div className="card-soft p-3 mt-5 text-left">
                <Row k="Bundle" v={`${NETWORK_LABEL[order.network] || order.network} · ${order.capacity}GB`} />
                <Row k="Recipient" v={maskPhone(order.recipientPhone)} />
                <Row k="Paid" v={formatGhs(order.amount)} />
                <Row k="Reference" v={ref} mono />
              </div>
            )}
            <p className="text-[12px] text-[color:var(--ink-faint)] mt-4">
              You can safely close this page — we'll keep delivering.
            </p>
          </>
        )}

        {phase === 'delivered' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-[color:var(--success)]/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-[color:var(--success)]" />
            </div>
            <h2 className="text-2xl font-black mt-4">Bundle delivered</h2>
            {order && (
              <p className="text-[14px] text-[color:var(--ink-mute)] mt-1">
                {order.capacity}GB sent to <strong>{maskPhone(order.recipientPhone)}</strong>.
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              <Link href={storeHref(storeSlug, '')} className="btn btn-primary">
                Buy another <Smartphone className="w-4 h-4" />
              </Link>
              <Link href={storeHref(storeSlug, '/register')} className="btn btn-ghost">
                Create account
              </Link>
            </div>
            <p className="text-[12px] text-[color:var(--ink-faint)] mt-4">
              Save your details next time — register for one-tap re-orders and higher limits.
            </p>
          </>
        )}

        {/* One wheel for both "on its way" and "delivered": the page moves
            between them on its own, and a spin in progress must not reset. */}
        {(phase === 'placing' || phase === 'delivered') && (
          <SpinWin reference={ref} orderPhone={order?.recipientPhone} />
        )}

        {phase === 'failed' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
              <XCircle className="w-7 h-7 text-[color:var(--danger)]" />
            </div>
            <h2 className="text-2xl font-black mt-4">Payment didn't complete</h2>
            <p className="text-[13px] text-[color:var(--ink-mute)] mt-1">{error}</p>
            <div className="flex flex-wrap justify-center gap-2 mt-5">
              <Link href={storeHref(storeSlug, '')} className="btn btn-primary">
                Try again <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href={storeHref(storeSlug, '/register')} className="btn btn-ghost">
                Create account
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ k, v, mono }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-[12px]">
      <span className="text-[color:var(--ink-mute)]">{k}</span>
      <span className={`font-semibold text-[color:var(--ink)] ${mono ? 'font-mono text-[11px]' : ''}`}>{v}</span>
    </div>
  );
}

export default function GuestReturnPage() {
  return (
    <Suspense fallback={null}>
      <ReturnInner />
    </Suspense>
  );
}
