'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Wallet, Package, ShoppingBag, ArrowUpRight, Copy, Check,
  ExternalLink, MessageCircle, TrendingUp
} from 'lucide-react';
import { storePortal } from '@/lib/fullstore/api';

const ghs = (n) => `GH₵${Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const PLATFORM_SLUG = 'databundle';

export default function Overview() {
  const params = useParams();
  const slug = params?.storeSlug || PLATFORM_SLUG;
  const [data, setData] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let stopped = false;
    (async () => {
      try {
        const [s, st] = await Promise.all([
          storePortal.myStore(slug).catch(() => null),
          storePortal.myStoreStats(slug, 'today').catch(() => null)
        ]);
        if (stopped) return;
        setData(s?.data || null);
        setStats(st?.data || null);
      } finally {
        if (!stopped) setLoading(false);
      }
    })();
    return () => { stopped = true; };
  }, [slug]);

  const store = data?.store || {};
  const wallet = data?.wallet || {};
  const storefrontUrl = store.storefrontUrl || (store.slug ? `https://databundle.shop/${store.slug}` : '');

  const copyLink = () => {
    if (!storefrontUrl) return;
    navigator.clipboard.writeText(storefrontUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const whatsappShare = storefrontUrl
    ? `https://wa.me/?text=${encodeURIComponent(`Buy data bundles from my store — fast & cheap.\n\n${storefrontUrl}`)}`
    : '#';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">My Store</h1>
        <p className="text-[13px] text-[color:var(--ink-mute)] mt-0.5">
          Your earnings, your link to share, what to do next.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="card p-5 bg-gradient-to-br from-[color:var(--brand)] to-[color:var(--brand-deep)] text-black">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-4 h-4" />
            <span className="text-[12px] font-bold">Available</span>
          </div>
          <div className="text-2xl font-black">{loading ? '…' : ghs(wallet.availableBalance)}</div>
          {wallet.maxWithdrawable !== undefined && (
            <div className="text-[11px] opacity-75 mt-1">
              Max withdrawable: {ghs(wallet.maxWithdrawable)}
            </div>
          )}
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-[color:var(--success)]" />
            <span className="text-[12px] font-bold text-[color:var(--ink-mute)]">Total earnings</span>
          </div>
          <div className="text-2xl font-black">{loading ? '…' : ghs(wallet.totalEarnings)}</div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpRight className="w-4 h-4 text-[color:var(--ink-mute)]" />
            <span className="text-[12px] font-bold text-[color:var(--ink-mute)]">Total withdrawn</span>
          </div>
          <div className="text-2xl font-black">{loading ? '…' : ghs(wallet.totalWithdrawn)}</div>
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <div className="flex items-center gap-2 mb-1">
          <MessageCircle className="w-4 h-4 text-[color:var(--brand-deep)]" />
          <h2 className="text-base font-bold">Share your store</h2>
        </div>
        <p className="text-[13px] text-[color:var(--ink-mute)] mb-4">
          Send this link to anyone — they buy, you keep the profit.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1 bg-[color:var(--surface-2)] border border-[color:var(--border)] rounded-xl px-3 py-2.5 text-[13px] font-mono truncate">
            {storefrontUrl || '—'}
          </div>
          <div className="flex gap-2">
            <button onClick={copyLink} disabled={!storefrontUrl} className="btn btn-ghost h-11 px-4 text-[13px] whitespace-nowrap disabled:opacity-40">
              {copied ? <><Check className="w-4 h-4" /> Copied</> : <><Copy className="w-4 h-4" /> Copy</>}
            </button>
            <a href={whatsappShare} target="_blank" rel="noreferrer" className={`btn btn-primary h-11 px-4 text-[13px] whitespace-nowrap ${storefrontUrl ? '' : 'pointer-events-none opacity-40'}`}>
              <MessageCircle className="w-4 h-4" /> WhatsApp
            </a>
            {storefrontUrl && (
              <Link href={storefrontUrl} target="_blank" className="btn btn-ghost h-11 px-3 text-[13px] whitespace-nowrap">
                <ExternalLink className="w-4 h-4" />
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card label="Orders today" value={stats?.stats?.totalOrders ?? '—'} />
        <Card label="Delivered today" value={stats?.stats?.completedOrders ?? '—'} />
        <Card label="Revenue today" value={loading ? '…' : ghs(stats?.stats?.totalRevenue || 0)} />
        <Card label="Profit today" value={loading ? '…' : ghs(stats?.stats?.totalProfit || 0)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <ActionCard href="/reseller/products" icon={Package} title="Set prices" subtitle="Adjust how much you sell each bundle for" />
        <ActionCard href="/reseller/withdrawals" icon={Wallet} title="Withdraw" subtitle="Send your earnings to MoMo" />
        <ActionCard href="/reseller/orders" icon={ShoppingBag} title="See orders" subtitle="Everything customers bought from you" />
      </div>
    </div>
  );
}

function Card({ label, value }) {
  return (
    <div className="card p-4">
      <div className="text-[11px] uppercase tracking-wider text-[color:var(--ink-faint)] font-semibold">{label}</div>
      <div className="text-lg font-black mt-1">{value}</div>
    </div>
  );
}

function ActionCard({ href, icon: Icon, title, subtitle }) {
  return (
    <Link href={href} className="card p-4 hover:border-[color:var(--brand)] transition-colors block">
      <Icon className="w-5 h-5 text-[color:var(--brand-deep)] mb-2" />
      <div className="text-sm font-bold">{title}</div>
      <div className="text-[12px] text-[color:var(--ink-mute)] mt-0.5">{subtitle}</div>
    </Link>
  );
}
