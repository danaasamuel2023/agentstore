'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/lib/fullstore/auth';
import { storePortal } from '@/lib/fullstore/api';
import { OrderCard } from '@/components/fullstore/OrderCard';
import { storeHref } from '@/lib/fullstore/links';

export default function OrdersPage() {
  const { storeSlug } = useParams();
  const router = useRouter();
  const { status } = useAuth();
  const [orders, setOrders] = useState(null);

  useEffect(() => {
    if (status === 'guest') router.replace(storeHref(storeSlug, '/login'));
  }, [status, storeSlug, router]);

  useEffect(() => {
    if (status !== 'authed') return;
    let stopped = false;
    const load = async () => {
      try {
        const res = await storePortal.orders(storeSlug, { page: 1, limit: 50 });
        if (!stopped) setOrders(res?.data?.orders || []);
      } catch { if (!stopped) setOrders((prev) => prev || []); }
    };
    load();
    // Check again every 30 seconds (while the tab is open) so delivery
    // updates appear without a refresh.
    const t = setInterval(() => { if (!document.hidden) load(); }, 30000);
    return () => { stopped = true; clearInterval(t); };
  }, [status, storeSlug]);

  if (status !== 'authed') return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Link href={storeHref(storeSlug, '/account')} className="text-[13px] text-[color:var(--ink-mute)] hover:text-[color:var(--ink)] mb-6 inline-block">
        ← Back to account
      </Link>

      <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-faint)] font-semibold mb-1">My orders</div>
      <h1 className="text-3xl font-black tracking-tight mb-6">Order history</h1>

      <div className="space-y-3">
        {orders === null ? (
          <div className="card p-6 flex items-center gap-2 text-[color:var(--ink-mute)] text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : orders.length === 0 ? (
          <div className="card p-10 text-center">
            <ShoppingBag className="w-8 h-8 mx-auto text-[color:var(--ink-faint)] mb-2" />
            <p className="text-[14px] text-[color:var(--ink-mute)]">No orders yet.</p>
          </div>
        ) : (
          orders.map((o) => <OrderCard key={o.id} order={o} />)
        )}
      </div>
    </div>
  );
}
