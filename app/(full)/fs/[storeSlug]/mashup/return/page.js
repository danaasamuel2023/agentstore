'use client';

/**
 * Where the payment page sends a MashUp buyer back to.
 *
 * Verifies through the agent-store path (the one /mashup/initialize paid
 * through), falls back to the status endpoint, then polls until the PACK —
 * not the payment — is delivered. The payment turns "completed" the moment
 * money lands; a pack can take up to an hour after that, so only the order's
 * own delivery status may say "delivered".
 */

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react';
import { storeHref } from '@/lib/fullstore/links';

const API = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.datamartgh.shop'}/api/v1/agent-stores`;
const POLL_MS = 20_000;
const MAX_POLLS = 9; // ~3 minutes on screen; delivery continues after the page closes

async function readJson(url) {
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!(r.headers.get('content-type') || '').includes('application/json')) return null;
  return r.json();
}

function ReturnInner() {
  const { storeSlug } = useParams();
  const search = useSearchParams();
  const ref = (search.get('reference') || search.get('trxref') || '').split(':')[0].trim();

  const [phase, setPhase] = useState('checking'); // checking | paid | delivered | failed
  const [tx, setTx] = useState(null);

  useEffect(() => {
    if (!ref) { setPhase('failed'); return; }
    let stopped = false;
    let polls = 0;
    const slug = encodeURIComponent(storeSlug);

    const fromStatus = (d) => ({
      transactionId: d.transactionId,
      amount: d.sellingPrice || d.amount,
      comboCost: d.comboCost || d.product?.comboCost,
      phoneNumber: d.phoneNumber || d.customerPhone,
      paid: d.paymentStatus === 'completed' || d.orderStatus === 'completed',
      failed: d.paymentStatus === 'failed',
      delivery: d.dataPurchase?.status || d.delivery?.status || null,
    });

    const check = async (first) => {
      try {
        let t = null;
        if (first) {
          const v = await readJson(`${API}/stores/${slug}/payment/verify?reference=${encodeURIComponent(ref)}`).catch(() => null);
          if (v?.status === 'success' && v.data) {
            t = {
              transactionId: v.data.transactionId,
              amount: v.data.amount,
              comboCost: v.data.product?.comboCost,
              phoneNumber: v.data.phoneNumber,
              paid: true,
              delivery: v.data.delivery?.status || null,
            };
          }
        }
        if (!t) {
          const s = await readJson(`${API}/stores/${slug}/payment/status/${encodeURIComponent(ref)}`).catch(() => null);
          if (s?.status === 'success' && s.data) t = fromStatus(s.data);
        }
        if (stopped) return;
        if (t) setTx(t);
        if (t?.delivery === 'completed') return setPhase('delivered');
        if (t?.failed) return setPhase('failed');
        if (t?.paid) setPhase('paid');
      } catch { /* keep polling */ }
      polls += 1;
      if (!stopped && polls < MAX_POLLS) setTimeout(() => check(false), POLL_MS);
      else if (!stopped) setPhase((p) => (p === 'checking' ? 'paid' : p));
    };
    check(true);
    return () => { stopped = true; };
  }, [ref, storeSlug]);

  const pack = tx?.comboCost ? `MTN MashUp ₵${tx.comboCost}` : 'MTN MashUp pack';

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

        {(phase === 'paid' || phase === 'delivered') && (
          <>
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto ${phase === 'delivered' ? 'bg-[color:var(--success)]/10' : 'bg-[color:var(--brand-glow)]'}`}>
              {phase === 'delivered'
                ? <CheckCircle2 className="w-7 h-7 text-[color:var(--success)]" />
                : <Clock className="w-7 h-7 text-[color:var(--brand-deep)]" />}
            </div>
            <h2 className="text-2xl font-black mt-4">{phase === 'delivered' ? 'Pack delivered' : 'Payment received'}</h2>
            <p className="text-[13px] text-[color:var(--ink-mute)] mt-1">
              {phase === 'delivered'
                ? 'Check the phone — the pack is on it.'
                : 'Your pack is being loaded. It usually arrives instantly. You can close this page.'}
            </p>
            <div className="card-soft p-3 mt-5 text-left">
              <Row k="Pack" v={pack} />
              {tx?.phoneNumber && <Row k="Sent to" v={tx.phoneNumber} />}
              {tx?.amount != null && <Row k="Paid" v={`GH₵${Number(tx.amount).toFixed(2)}`} />}
              <Row k="Reference" v={tx?.transactionId || ref} mono />
            </div>
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              <Link href={storeHref(storeSlug, '/mashup')} className="btn btn-primary">Buy another <ArrowRight className="w-4 h-4" /></Link>
              <Link href={storeHref(storeSlug, '')} className="btn btn-ghost">Data bundles</Link>
            </div>
          </>
        )}

        {phase === 'failed' && (
          <>
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
              <XCircle className="w-7 h-7 text-[color:var(--danger)]" />
            </div>
            <h2 className="text-2xl font-black mt-4">Payment didn&apos;t complete</h2>
            <p className="text-[13px] text-[color:var(--ink-mute)] mt-1">No money was taken for this pack. You can try again.</p>
            <Link href={storeHref(storeSlug, '/mashup')} className="btn btn-primary mt-5 inline-flex">Try again <ArrowRight className="w-4 h-4" /></Link>
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

export default function MashupReturnPage() {
  return (
    <Suspense fallback={null}>
      <ReturnInner />
    </Suspense>
  );
}
