'use client';

/**
 * Customer dashboard — mirrors the DataMart agent dashboard aesthetic:
 * bold yellow-amber hero with greeting + quick actions, dark status
 * strip beneath it, gradient stat-card grid, then a compact orders
 * list. All colors come from CSS tokens so dark-mode flips cleanly.
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Wallet, ArrowUpRight, ArrowDownRight, ShoppingBag, Plus, Zap, Shield,
  Wifi, Clock, Loader2, ChevronRight, Receipt, User, CreditCard, Package,
  TrendingUp, Settings, Store, Sparkles
} from 'lucide-react';
import { useAuth } from '@/lib/fullstore/auth';
import { storePortal } from '@/lib/fullstore/api';
import { formatGhs, maskPhone, NETWORK_LABEL, relativeTime } from '@/lib/fullstore/format';
import { NetworkIcon } from '@/components/fullstore/NetworkIcon';
import { storeHref } from '@/lib/fullstore/links';
import { StartSellingPopup } from '@/components/fullstore/StartSellingPopup';

function greetingFor(hour) {
  if (hour < 12) return { tw: 'Mema wo akye', en: 'Morning' };
  if (hour < 18) return { tw: 'Mema wo aha', en: 'Afternoon' };
  return { tw: 'Mema wo adwo', en: 'Evening' };
}

export default function AccountHomePage() {
  const { storeSlug } = useParams();
  const router = useRouter();
  const { status, customer, wallet } = useAuth();

  const [orders, setOrders] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    if (status === 'guest') router.replace(storeHref(storeSlug, '/login'));
  }, [status, storeSlug, router]);

  useEffect(() => {
    if (status !== 'authed') return;
    let stopped = false;
    (async () => {
      setLoadingOrders(true);
      try {
        const res = await storePortal.orders(storeSlug, { page: 1, limit: 5 });
        if (!stopped) setOrders(res?.data?.orders || []);
      } catch { if (!stopped) setOrders([]); }
      if (!stopped) setLoadingOrders(false);
    })();
    return () => { stopped = true; };
  }, [status, storeSlug]);

  // Live clock — keeps the status strip alive, like the DataMart side.
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (status !== 'authed') {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[color:var(--ink-faint)]" />
      </div>
    );
  }

  const firstName = (customer?.name || '').split(' ')[0] || 'there';
  const spendable = wallet?.spendable ?? customer?.walletBalance ?? 0;
  const onHold = wallet?.onHold ?? 0;
  const g = greetingFor(now.getHours());

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-4">
      {/* One-time promo popup for customers who don't yet own a store.
       * Self-managed via localStorage dismiss flag; will not show again
       * once the customer taps "Maybe later" or after they create a
       * store (popup auto-hides when ownedStoreId is set). */}
      <StartSellingPopup customer={customer} />

      {/* =========================================================
       *  HERO — yellow→amber gradient, greeting, quick actions
       * ========================================================= */}
      <section className="rounded-2xl shadow-md overflow-hidden bg-gradient-to-br from-[#FBBF24] to-[#F59E0B]">
        <div className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl font-black text-black/90 leading-tight">
                <span>{g.tw},</span>{' '}
                <span>{firstName}!</span>
              </h1>
              <p className="text-black/70 text-[12px] sm:text-sm mt-1">
                Good {g.en}! Welcome back to DataBundle
              </p>
              <span className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full bg-black/15 border border-black/20 text-black/80 text-[10px] sm:text-[11px] font-bold">
                Where data is fast
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href={storeHref(storeSlug, '/account/profile')}
                aria-label="Edit profile"
                title="Edit profile"
                className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/15 hover:bg-black/25 flex items-center justify-center text-black transition-colors"
              >
                <User className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Quick actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href={storeHref(storeSlug, '/account/wallet/deposit')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold text-xs sm:text-sm shadow-md"
            >
              <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Deposit Now
            </Link>
            <Link
              href={storeHref(storeSlug, '')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1a1a16] hover:bg-black text-white font-bold text-xs sm:text-sm shadow-md transition-colors [&>svg]:text-[color:var(--brand)]"
            >
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Buy Bundles
            </Link>
            <Link
              href={storeHref(storeSlug, '/account/orders')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1a1a16] hover:bg-black text-white font-bold text-xs sm:text-sm shadow-md transition-colors [&>svg]:text-[color:var(--brand)]"
            >
              <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Orders
            </Link>
            <Link
              href={storeHref(storeSlug, '/account/wallet')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1a1a16] hover:bg-black text-white font-bold text-xs sm:text-sm shadow-md transition-colors [&>svg]:text-[color:var(--brand)]"
            >
              <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Transactions
            </Link>
            <Link
              href={storeHref(storeSlug, '/account/profile')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1a1a16] hover:bg-black text-white font-bold text-xs sm:text-sm shadow-md transition-colors [&>svg]:text-[color:var(--brand)]"
            >
              <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Profile
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================
       *  START SELLING CTA — only visible if the customer doesn't
       *  yet own a store. Lets them flip into agent mode from here.
       * ========================================================= */}
      {!customer?.ownedStoreId && (
        <section className="rounded-2xl border-2 border-dashed border-[color:var(--brand)]/40 bg-[color:var(--brand)]/5 p-4 sm:p-5">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[color:var(--brand)]/20 flex items-center justify-center flex-shrink-0">
              <span className="text-xl sm:text-2xl">💼</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm sm:text-base font-black text-[color:var(--ink)]">Want to sell bundles too?</h3>
              <p className="text-[12px] sm:text-[13px] text-[color:var(--ink-mute)] mt-0.5">
                Open your own DataBundle store in 30 seconds. Set your prices, share your link, keep the profit.
              </p>
              <Link
                href="/start-selling"
                className="inline-flex items-center gap-1.5 mt-3 px-4 py-2 rounded-xl bg-[color:var(--ink)] text-[color:var(--brand)] dark:bg-[color:var(--brand)] dark:text-black text-[13px] font-bold hover:opacity-90"
              >
                Start selling <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================
       *  STATUS STRIP — dark slate with live clock + feature chips
       * ========================================================= */}
      <section className="rounded-2xl shadow-md bg-[#1a1a16] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="relative inline-flex">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping absolute opacity-75" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 relative" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold text-white">System Online</span>
                <span className="px-1.5 py-0.5 bg-[color:var(--brand)] text-black rounded text-[10px] font-extrabold leading-none">24/7</span>
              </div>
              <div className="flex items-center gap-1 text-gray-400 text-[10px] sm:text-xs mt-0.5">
                <Clock className="w-3 h-3" />
                <span className="tabular-nums">
                  {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Chip icon={Zap}>Instant</Chip>
            <Chip icon={Shield}>Secure</Chip>
            <Chip icon={Wifi}>Always Open</Chip>
          </div>
        </div>
      </section>

      {/* =========================================================
       *  STAT CARDS — balance hero + three lifetime tiles
       * ========================================================= */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Balance — gradient hero tile, spans 2 cols on mobile */}
        <div className="col-span-2 lg:col-span-2 rounded-2xl shadow-md overflow-hidden bg-gradient-to-br from-[#FBBF24] to-[#F59E0B] p-4 sm:p-5 relative">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-black/10" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[10px] sm:text-[11px] uppercase tracking-wider font-bold text-black/70 flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" /> Wallet balance
              </div>
              <Link
                href={storeHref(storeSlug, '/account/wallet/deposit')}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-black hover:bg-[#1a1a16] text-white text-[12px] font-bold transition-colors [&>svg]:text-[color:var(--brand)]"
              >
                <Plus className="w-3 h-3" /> Top up
              </Link>
            </div>
            <div className="mt-2 text-3xl sm:text-4xl font-black text-black tabular-nums">
              {formatGhs(spendable)}
            </div>
            {onHold > 0 && (
              <div className="text-[11px] text-black/70 mt-1">
                +{formatGhs(onHold)} on a 24h hold
              </div>
            )}
          </div>
        </div>

        <StatTile
          icon={ArrowDownRight}
          label="Deposited"
          value={formatGhs(customer?.totalDeposited || 0)}
          accent="emerald"
        />
        <StatTile
          icon={ArrowUpRight}
          label="Spent"
          value={formatGhs(customer?.totalSpent || 0)}
          accent="rose"
        />
        <StatTile
          icon={ShoppingBag}
          label="Orders"
          value={customer?.orderCount || 0}
          accent="brand"
        />
        <StatTile
          icon={TrendingUp}
          label="Avg per order"
          value={
            customer?.orderCount > 0
              ? formatGhs((customer.totalSpent || 0) / customer.orderCount)
              : formatGhs(0)
          }
          accent="slate"
        />
      </section>

      {/* =========================================================
       *  EARN BANNER — invite customers to open their own store
       * ========================================================= */}
      <section className="rounded-2xl overflow-hidden shadow-md bg-gradient-to-r from-[#0F0E0B] to-[#2a2a26] text-white">
        <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-[color:var(--brand)] text-black flex items-center justify-center flex-shrink-0">
              <Store className="w-5 h-5" />
            </span>
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-black text-white truncate">
                Start your own store
              </div>
              <div className="text-[11px] sm:text-[12px] text-white/70">
                Sell bundles at your own prices · withdraw earnings to MoMo
              </div>
            </div>
          </div>
          <Link
            href="/start-selling"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[color:var(--brand)] hover:bg-[color:var(--brand-deep)] text-black font-bold text-xs sm:text-sm whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Start selling
          </Link>
        </div>
      </section>

      {/* =========================================================
       *  RECENT ORDERS — tight list, "see all" pinned right
       * ========================================================= */}
      <section className="rounded-2xl bg-[color:var(--surface)] border border-[color:var(--border)] shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-[color:var(--border)]">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)] font-bold">Recent orders</div>
            <h2 className="text-base sm:text-lg font-black tracking-tight">Last few bundles</h2>
          </div>
          <Link
            href={storeHref(storeSlug, '/account/orders')}
            className="inline-flex items-center gap-1 text-[12px] font-bold text-[color:var(--brand-deep)] hover:underline"
          >
            See all <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-[color:var(--border)]">
          {loadingOrders ? (
            <div className="p-6 flex items-center gap-2 text-[color:var(--ink-mute)] text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading…
            </div>
          ) : orders && orders.length > 0 ? (
            orders.map((o) => <OrderRow key={o.id} order={o} storeSlug={storeSlug} />)
          ) : (
            <EmptyOrders storeSlug={storeSlug} />
          )}
        </div>
      </section>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function Chip({ icon: Icon, children }) {
  return (
    <span className="inline-flex items-center gap-1 bg-[#2a2a26] px-2 py-1 rounded-lg">
      <Icon className="w-3 h-3 text-[color:var(--brand)]" />
      <span className="text-[10px] sm:text-[11px] text-gray-300 font-medium hidden sm:inline">{children}</span>
    </span>
  );
}

const ACCENT_BG = {
  emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300',
  rose:    'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300',
  brand:   'bg-[color:var(--brand-glow)] text-[color:var(--brand-deep)]',
  slate:   'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
};

function StatTile({ icon: Icon, label, value, accent = 'brand' }) {
  return (
    <div className="rounded-2xl bg-[color:var(--surface)] border border-[color:var(--border)] shadow-sm p-4">
      <div className="flex items-center gap-2">
        <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${ACCENT_BG[accent]}`}>
          <Icon className="w-4 h-4" />
        </span>
        <span className="text-[10px] uppercase tracking-wider font-bold text-[color:var(--ink-faint)]">
          {label}
        </span>
      </div>
      <div className="text-lg sm:text-xl font-black mt-2 tabular-nums text-[color:var(--ink)]">
        {value}
      </div>
    </div>
  );
}

function statusBadge(status) {
  const map = {
    completed: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800', label: 'Delivered' },
    delivered: { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800', label: 'Delivered' },
    failed:    { cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800', label: 'Failed' },
    refunded:  { cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800', label: 'Refunded' },
    processing:{ cls: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800', label: 'Processing' },
    pending:   { cls: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800', label: 'Pending' }
  };
  const s = map[status] || { cls: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700', label: status || 'Unknown' };
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${s.cls}`}>
      {s.label}
    </span>
  );
}

function OrderRow({ order, storeSlug }) {
  return (
    <Link
      href={storeHref(storeSlug, '/account/orders')}
      className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-[color:var(--surface-2)] transition-colors"
    >
      <NetworkIcon network={order.network} size={36} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-extrabold truncate">
          {order.capacity}GB {NETWORK_LABEL[order.network] || order.network}
        </div>
        <div className="text-[11px] text-[color:var(--ink-mute)] mt-0.5">
          {maskPhone(order.phoneNumber)} · {relativeTime(order.placedAt)}
        </div>
      </div>
      <div className="text-right">
        <div className="text-sm font-extrabold tabular-nums">{formatGhs(order.price)}</div>
        <div className="mt-1">{statusBadge(order.status)}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-[color:var(--ink-faint)] flex-shrink-0" />
    </Link>
  );
}

function EmptyOrders({ storeSlug }) {
  return (
    <div className="p-8 text-center">
      <div className="w-12 h-12 mx-auto rounded-2xl bg-[color:var(--surface-2)] flex items-center justify-center mb-3">
        <ShoppingBag className="w-5 h-5 text-[color:var(--ink-faint)]" />
      </div>
      <h3 className="text-base font-extrabold mb-1">No orders yet</h3>
      <p className="text-[12px] text-[color:var(--ink-mute)] mb-4">
        Buy your first bundle and it'll show up here.
      </p>
      <Link href={storeHref(storeSlug, '')} className="btn btn-primary">
        Browse bundles <ChevronRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
