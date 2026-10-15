'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, ShoppingBag, Phone } from 'lucide-react';
import { storePortal } from '@/lib/fullstore/api';

const PLATFORM_SLUG = 'databundle';

const ghs = (n) => `GH₵${Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dt = (s) => s ? new Date(s).toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const maskPhone = (p) => p ? `${String(p).slice(0,3)}****${String(p).slice(-3)}` : '—';
const networkLabel = (n) => n === 'YELLO' ? 'MTN' : n === 'AT_PREMIUM' ? 'AirtelTigo' : n ? (n.charAt(0) + n.slice(1).toLowerCase()) : '—';

const STATUS_STYLES = {
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  delivered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
};

export default function OrdersPage() {
  const params = useParams();
  const slug = params?.storeSlug || PLATFORM_SLUG;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let stopped = false;
    (async () => {
      try {
        const q = { limit: 50 };
        if (filter !== 'all') q.status = filter;
        const r = await storePortal.myStoreOrders(slug, q);
        if (!stopped) setRows(r?.data || []);
      } catch (_) {
        if (!stopped) setRows([]);
      } finally {
        if (!stopped) setLoading(false);
      }
    })();
    return () => { stopped = true; };
  }, [filter, slug]);

  const FILTERS = [
    { v: 'all', label: 'All' },
    { v: 'completed', label: 'Delivered' },
    { v: 'pending', label: 'Pending' },
    { v: 'failed', label: 'Failed' }
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Orders</h1>
        <p className="text-[13px] text-[color:var(--ink-mute)] mt-0.5">Every bundle your customers ordered from your store.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {FILTERS.map(f => (
          <button
            key={f.v}
            onClick={() => setFilter(f.v)}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap border ${
              filter === f.v
                ? 'border-[color:var(--brand)] bg-[color:var(--brand)]/10 text-[color:var(--brand-deep)]'
                : 'border-[color:var(--border)] text-[color:var(--ink-mute)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-10 flex items-center justify-center text-[color:var(--ink-faint)]">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="card p-10 text-center">
          <ShoppingBag className="w-8 h-8 mx-auto text-[color:var(--ink-faint)] mb-2" />
          <p className="text-[13px] text-[color:var(--ink-mute)]">No orders yet. Share your store link to start selling.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead className="bg-[color:var(--surface-2)] text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)]">
              <tr>
                <th className="text-left px-3 py-3 font-bold">When</th>
                <th className="text-left px-3 py-3 font-bold">Bundle</th>
                <th className="text-left px-3 py-3 font-bold">Recipient</th>
                <th className="text-right px-3 py-3 font-bold">Amount</th>
                <th className="text-right px-3 py-3 font-bold">Profit</th>
                <th className="text-center px-3 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(o => (
                <tr key={o._id} className="border-t border-[color:var(--border)] hover:bg-[color:var(--surface-2)]/40">
                  <td className="px-3 py-2.5 whitespace-nowrap text-[color:var(--ink-mute)]">{dt(o.createdAt)}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap font-semibold">{o.capacity}GB <span className="text-[color:var(--ink-mute)] font-normal">{networkLabel(o.network)}</span></td>
                  <td className="px-3 py-2.5 font-mono text-[12px] text-[color:var(--ink-mute)] flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {maskPhone(o.phoneNumber || o.recipientPhone)}
                  </td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{ghs(o.sellingPrice || o.amount)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-green-600">{ghs(o.subAgentProfit || o.profit || 0)}</td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_STYLES[o.orderStatus || o.status] || 'bg-gray-100 text-gray-700'}`}>
                      {o.orderStatus || o.status || '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
