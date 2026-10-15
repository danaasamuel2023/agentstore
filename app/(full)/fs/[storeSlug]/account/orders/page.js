'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ChevronRight, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/lib/fullstore/auth';
import { storePortal } from '@/lib/fullstore/api';
import { formatGhs, maskPhone, NETWORK_LABEL, relativeTime } from '@/lib/fullstore/format';
import { NetworkIcon } from '@/components/fullstore/NetworkIcon';
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
    (async () => {
      try {
        const res = await storePortal.orders(storeSlug, { page: 1, limit: 50 });
        if (!stopped) setOrders(res?.data?.orders || []);
      } catch { if (!stopped) setOrders([]); }
    })();
    return () => { stopped = true; };
  }, [status, storeSlug]);

  if (status !== 'authed') return null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Link href={storeHref(storeSlug, '/account')} className="text-[13px] text-[color:var(--ink-mute)] hover:text-[color:var(--ink)] mb-6 inline-block">
        ← Back to account
      </Link>

      <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-faint)] font-semibold mb-1">My orders</div>
      <h1 className="text-3xl font-black tracking-tight mb-6">Order history</h1>

      <div className="card divide-y divide-[color:var(--border)]">
        {orders === null ? (
          <div className="p-6 flex items-center gap-2 text-[color:var(--ink-mute)] text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center">
            <ShoppingBag className="w-8 h-8 mx-auto text-[color:var(--ink-faint)] mb-2" />
            <p className="text-[14px] text-[color:var(--ink-mute)]">No orders yet.</p>
          </div>
        ) : (
          orders.map((o) => (
            <Link key={o.id} href={storeHref(storeSlug, `/account/orders/${o.id}`)} className="flex items-center gap-3 p-4 hover:bg-[color:var(--surface-2)] transition-colors">
              <NetworkIcon network={o.network} size={36} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-extrabold truncate">{o.capacity}GB {NETWORK_LABEL[o.network] || o.network}</div>
                <div className="text-[11px] text-[color:var(--ink-mute)]">{maskPhone(o.phoneNumber)} · {relativeTime(o.placedAt)}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-extrabold tabular-nums">{formatGhs(o.price)}</div>
                <div className="text-[10px] uppercase tracking-wider font-bold text-[color:var(--ink-mute)]">{o.status}</div>
              </div>
              <ChevronRight className="w-4 h-4 text-[color:var(--ink-faint)]" />
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
