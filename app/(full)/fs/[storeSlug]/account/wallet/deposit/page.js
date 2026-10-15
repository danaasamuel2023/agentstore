'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, Smartphone, ShieldCheck, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/fullstore/auth';
import { storePortal } from '@/lib/fullstore/api';
import { formatGhs } from '@/lib/fullstore/format';
import { storeHref } from '@/lib/fullstore/links';

const QUICK_AMOUNTS = [5, 10, 20, 50];

export default function DepositPage() {
  const { storeSlug } = useParams();
  const router = useRouter();
  const { status } = useAuth();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'guest') router.replace(storeHref(storeSlug, '/login'));
  }, [status, storeSlug, router]);

  const submit = async (e) => {
    e.preventDefault();
    const n = Number(amount);
    if (!Number.isFinite(n) || n < 1) { setError('Enter an amount of at least GH₵ 1'); return; }
    setError('');
    setLoading(true);
    try {
      const idem = crypto.randomUUID();
      const res = await storePortal.initiateDeposit(storeSlug, { amount: n }, idem);
      const url = res?.data?.authorizationUrl;
      if (url) {
        window.location.href = url;
        return;
      }
      throw new Error('No payment URL returned');
    } catch (err) {
      setError(err.message || 'Could not start the deposit.');
      setLoading(false);
    }
  };

  if (status !== 'authed') {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[color:var(--ink-faint)]" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Link href={storeHref(storeSlug, '/account/wallet')} className="text-[13px] text-[color:var(--ink-mute)] hover:text-[color:var(--ink)] mb-6 inline-block">
        ← Back to wallet
      </Link>

      <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-faint)] font-semibold mb-2">Top up wallet</div>
      <h1 className="text-3xl font-black tracking-tight">How much?</h1>
      <p className="text-[14px] text-[color:var(--ink-mute)] mt-1.5">Pay with Mobile Money via Paystack.</p>

      <form onSubmit={submit} className="mt-7 space-y-4">
        <div className="grid grid-cols-4 gap-2">
          {QUICK_AMOUNTS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setAmount(String(n))}
              className={`py-3 rounded-xl border font-extrabold tabular-nums transition-colors ${
                Number(amount) === n
                  ? 'border-[color:var(--ink)] bg-[color:var(--brand-glow)]'
                  : 'border-[color:var(--border-strong)] hover:bg-[color:var(--surface-2)]'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--ink-faint)] font-bold">GH₵</span>
          <input
            type="number"
            inputMode="decimal"
            min="1"
            step="0.5"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
            className="input pl-14 text-2xl font-black tabular-nums"
          />
        </div>

        <div className="card-soft p-4 text-[12px] text-[color:var(--ink-mute)] leading-relaxed">
          <div className="flex items-center gap-2 mb-1.5 text-[color:var(--ink)] font-semibold text-[13px]">
            <ShieldCheck className="w-4 h-4 text-[color:var(--brand-deep)]" /> Safe top-up
          </div>
          Pilot caps: <strong>GH₵ 50/day</strong> per customer. Your first deposit has a <strong>24-hour security hold</strong> before it can be spent.
        </div>

        {error && (
          <div className="flex items-start gap-2 text-[13px] text-[color:var(--danger)] bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
          </div>
        )}

        <button type="submit" disabled={loading || !amount} className="btn btn-yellow w-full justify-center mt-2 disabled:opacity-60">
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Starting Paystack…</>
          ) : (
            <><Smartphone className="w-4 h-4" /> Pay {amount ? formatGhs(amount) : ''} <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </form>
    </div>
  );
}
