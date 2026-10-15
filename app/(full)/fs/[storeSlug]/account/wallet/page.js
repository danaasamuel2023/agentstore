'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Loader2, ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';
import { useAuth } from '@/lib/fullstore/auth';
import { storePortal } from '@/lib/fullstore/api';
import { formatGhs, relativeTime } from '@/lib/fullstore/format';
import { storeHref } from '@/lib/fullstore/links';

export default function WalletPage() {
  const { storeSlug } = useParams();
  const router = useRouter();
  const { status, wallet, customer } = useAuth();

  const [txs, setTxs] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'guest') router.replace(storeHref(storeSlug, '/login'));
  }, [status, storeSlug, router]);

  useEffect(() => {
    if (status !== 'authed') return;
    let stopped = false;
    (async () => {
      setLoading(true);
      try {
        const res = await storePortal.walletTransactions(storeSlug, { page: 1, limit: 30 });
        if (!stopped) setTxs(res?.data?.transactions || []);
      } catch { if (!stopped) setTxs([]); }
      if (!stopped) setLoading(false);
    })();
    return () => { stopped = true; };
  }, [status, storeSlug]);

  if (status !== 'authed') {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[color:var(--ink-faint)]" />
      </div>
    );
  }

  const spendable = wallet?.spendable ?? customer?.walletBalance ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Link href={storeHref(storeSlug, '/account')} className="text-[13px] text-[color:var(--ink-mute)] hover:text-[color:var(--ink)] mb-6 inline-block">
        ← Back to account
      </Link>

      <div className="card p-6 sm:p-8 mb-6 relative overflow-hidden">
        <div className="brand-glow-2" style={{ top: -100, right: -100 }} />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[color:var(--ink-faint)] font-semibold mb-1">
              <Wallet className="w-3.5 h-3.5" /> Wallet balance
            </div>
            <div className="text-4xl sm:text-5xl font-black tabular-nums">{formatGhs(spendable)}</div>
            {wallet?.onHold > 0 && (
              <div className="text-[12px] text-[color:var(--ink-mute)] mt-1.5">
                +{formatGhs(wallet.onHold)} on a 24h security hold
              </div>
            )}
          </div>
          <Link href={storeHref(storeSlug, '/account/wallet/deposit')} className="btn btn-yellow">
            <Plus className="w-4 h-4" /> Top up
          </Link>
        </div>
      </div>

      <h2 className="text-xl font-black tracking-tight mb-4">Transactions</h2>

      <div className="card divide-y divide-[color:var(--border)]">
        {loading ? (
          <div className="p-6 flex items-center gap-2 text-[color:var(--ink-mute)] text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : (txs && txs.length > 0) ? (
          txs.map((t) => <TxRow key={t.id} t={t} />)
        ) : (
          <div className="p-10 text-center">
            <p className="text-[14px] text-[color:var(--ink-mute)]">No transactions yet.</p>
            <p className="text-[12px] text-[color:var(--ink-faint)] mt-1">Top up to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TxRow({ t }) {
  const isCredit = t.type === 'credit';
  return (
    <div className="flex items-center gap-3 p-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isCredit ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
        {isCredit ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold capitalize">
          {t.reason?.replaceAll('_', ' ') || (isCredit ? 'Credit' : 'Debit')}
        </div>
        <div className="text-[11px] text-[color:var(--ink-mute)]">{relativeTime(t.createdAt)}</div>
      </div>
      <div className="text-right">
        <div className={`text-sm font-extrabold tabular-nums ${isCredit ? 'text-[color:var(--success)]' : 'text-[color:var(--ink)]'}`}>
          {isCredit ? '+' : '−'} {formatGhs(t.amount)}
        </div>
        <div className="text-[10px] text-[color:var(--ink-faint)] tabular-nums">Bal: {formatGhs(t.balanceAfter)}</div>
      </div>
    </div>
  );
}
