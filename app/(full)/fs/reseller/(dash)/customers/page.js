'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Users } from 'lucide-react';
import { storePortal } from '@/lib/fullstore/api';

const PLATFORM_SLUG = 'databundle';

const ghs = (n) => `GH₵${Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dt = (s) => s ? new Date(s).toLocaleDateString('en-GH', { dateStyle: 'medium' }) : '—';
const maskPhone = (p) => p ? `${String(p).slice(0,3)}****${String(p).slice(-3)}` : '—';

export default function CustomersPage() {
  const params = useParams();
  const slug = params?.storeSlug || PLATFORM_SLUG;
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stopped = false;
    (async () => {
      try {
        const r = await storePortal.myStoreCustomers(slug, { limit: 50 });
        if (!stopped) setRows(r?.data || []);
      } catch (_) {
        if (!stopped) setRows([]);
      } finally {
        if (!stopped) setLoading(false);
      }
    })();
    return () => { stopped = true; };
  }, [slug]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Customers</h1>
        <p className="text-[13px] text-[color:var(--ink-mute)] mt-0.5">Everyone who bought from your store.</p>
      </div>

      {loading ? (
        <div className="card p-10 flex items-center justify-center text-[color:var(--ink-faint)]">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="card p-10 text-center">
          <Users className="w-8 h-8 mx-auto text-[color:var(--ink-faint)] mb-2" />
          <p className="text-[13px] text-[color:var(--ink-mute)]">No customers yet. Share your store link to start.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead className="bg-[color:var(--surface-2)] text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)]">
              <tr>
                <th className="text-left px-3 py-3 font-bold">Name</th>
                <th className="text-left px-3 py-3 font-bold">Phone</th>
                <th className="text-right px-3 py-3 font-bold">Orders</th>
                <th className="text-right px-3 py-3 font-bold">Total Spent</th>
                <th className="text-left px-3 py-3 font-bold">First Buy</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(c => (
                <tr key={c._id} className="border-t border-[color:var(--border)] hover:bg-[color:var(--surface-2)]/40">
                  <td className="px-3 py-2.5 font-semibold">{c.name || '—'}</td>
                  <td className="px-3 py-2.5 font-mono text-[12px] text-[color:var(--ink-mute)]">{maskPhone(c.phoneNumber)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{c.totalPurchases ?? c.orderCount ?? 0}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{ghs(c.totalSpent)}</td>
                  <td className="px-3 py-2.5 text-[color:var(--ink-mute)]">{dt(c.firstPurchaseDate || c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
