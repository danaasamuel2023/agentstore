'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, TrendingUp, Calendar } from 'lucide-react';
import { storePortal } from '@/lib/fullstore/api';

const PLATFORM_SLUG = 'databundle';

const ghs = (n) => `GH₵${Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PERIODS = [
  { v: 'today', label: 'Today' },
  { v: 'week', label: 'This week' },
  { v: 'month', label: 'This month' },
  { v: 'all', label: 'All time' }
];

export default function StatisticsPage() {
  const params = useParams();
  const slug = params?.storeSlug || PLATFORM_SLUG;
  const [data, setData] = useState(null);
  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stopped = false;
    setLoading(true);
    (async () => {
      try {
        const r = await storePortal.myStoreStats(slug, period);
        if (!stopped) setData(r?.data || null);
      } finally {
        if (!stopped) setLoading(false);
      }
    })();
    return () => { stopped = true; };
  }, [period, slug]);

  const s = data?.stats || {};

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Statistics</h1>
          <p className="text-[13px] text-[color:var(--ink-mute)] mt-0.5">Performance snapshot of your store.</p>
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {PERIODS.map(p => (
            <button
              key={p.v}
              onClick={() => setPeriod(p.v)}
              className={`px-3 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap border ${
                period === p.v
                  ? 'border-[color:var(--brand)] bg-[color:var(--brand)]/10 text-[color:var(--brand-deep)]'
                  : 'border-[color:var(--border)] text-[color:var(--ink-mute)]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="card p-10 flex items-center justify-center text-[color:var(--ink-faint)]">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Stat label="Total orders" value={s.totalOrders ?? 0} />
            <Stat label="Delivered" value={s.completedOrders ?? 0} accent="success" />
            <Stat label="Pending" value={s.pendingOrders ?? 0} />
            <Stat label="Failed" value={s.failedOrders ?? 0} accent="danger" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="Revenue" value={ghs(s.totalRevenue || 0)} icon={Calendar} />
            <Stat label="Profit" value={ghs(s.totalProfit || 0)} accent="success" icon={TrendingUp} />
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, accent, icon: Icon }) {
  const cls = accent === 'success' ? 'text-green-600 dark:text-green-400'
    : accent === 'danger' ? 'text-red-600 dark:text-red-400'
    : 'text-[color:var(--ink)]';
  return (
    <div className="card p-4">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-[color:var(--ink-faint)] font-semibold">
        {Icon && <Icon className="w-3 h-3" />}
        {label}
      </div>
      <div className={`text-xl font-black mt-1 ${cls}`}>{value}</div>
    </div>
  );
}
