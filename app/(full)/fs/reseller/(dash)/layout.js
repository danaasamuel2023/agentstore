'use client';

/**
 * Reseller dashboard shell — guards on the customer's existing session
 * (no separate reseller login). If the customer hasn't created a store
 * yet (customer.ownedStoreId is null), we redirect them to /start-selling
 * to spin one up.
 */

import { useEffect, useState } from 'react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Package, Wallet, Users, ShoppingBag, LineChart,
  ArrowLeft, Store, Menu, X
} from 'lucide-react';
import { useAuth } from '@/lib/fullstore/auth';
import { storePortal } from '@/lib/fullstore/api';

const NAV = [
  { href: '/reseller', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/reseller/products', label: 'Products', icon: Package },
  { href: '/reseller/withdrawals', label: 'Withdrawals', icon: Wallet },
  { href: '/reseller/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/reseller/customers', label: 'Customers', icon: Users },
  { href: '/reseller/statistics', label: 'Statistics', icon: LineChart }
];

export default function DashLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { status, customer } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [storeInfo, setStoreInfo] = useState(null);
  const slug = params?.storeSlug || (typeof window !== 'undefined' ? 'databundle' : 'databundle');

  // Bounce guests to login. The /reseller routes need an authed
  // customer; that customer might or might not own a store yet.
  useEffect(() => {
    if (status === 'guest') {
      router.replace(`/login?next=${encodeURIComponent('/reseller')}`);
    }
  }, [status, router]);

  // Bounce authed-but-no-store customers to the create-store flow.
  // customer.ownedStoreId is set by /customer/become-agent.
  useEffect(() => {
    if (status === 'authed' && customer && !customer.ownedStoreId) {
      router.replace('/start-selling');
    }
  }, [status, customer, router]);

  // Pull the store details (name, slug, etc.) once we know the customer
  // has one. Used by the sidebar header + storefront link.
  useEffect(() => {
    if (status !== 'authed' || !customer?.ownedStoreId) return;
    let stopped = false;
    storePortal.myStore(slug).then((r) => {
      if (!stopped && r?.data?.store) setStoreInfo(r.data.store);
    }).catch(() => {});
    return () => { stopped = true; };
  }, [status, customer?.ownedStoreId, slug]);

  if (status === 'loading' || status === 'idle' || status === 'guest' || !customer?.ownedStoreId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[color:var(--surface)]">
        <div className="text-[13px] text-[color:var(--ink-faint)]">Loading…</div>
      </div>
    );
  }

  const isActive = (item) => item.exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(item.href + '/');

  const SidebarBody = () => (
    <>
      <div className="px-4 py-5 border-b border-[color:var(--border)]">
        <Link href="/" className="flex items-center gap-2 mb-3 group">
          <ArrowLeft className="w-4 h-4 text-[color:var(--ink-faint)] group-hover:text-[color:var(--ink)]" />
          <span className="text-[11px] text-[color:var(--ink-faint)] group-hover:text-[color:var(--ink)]">Back to account</span>
        </Link>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[color:var(--brand)]/15 flex items-center justify-center">
            <Store className="w-4 h-4 text-[color:var(--brand-deep)]" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)] font-semibold">My Store</div>
            <div className="text-sm font-extrabold truncate">{storeInfo?.name || 'Your store'}</div>
          </div>
        </div>
        {storeInfo?.slug && (
          <Link
            href={`/${storeInfo.slug}`}
            target="_blank"
            className="block mt-2 text-[11px] text-[color:var(--ink-mute)] hover:text-[color:var(--ink)] truncate"
          >
            View storefront ↗
          </Link>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-colors ${
                active
                  ? 'bg-[color:var(--brand)]/10 text-[color:var(--brand-deep)]'
                  : 'text-[color:var(--ink-mute)] hover:bg-[color:var(--surface-2)] hover:text-[color:var(--ink)]'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-[color:var(--border)] text-[11px] text-[color:var(--ink-faint)] truncate">
        Signed in as {customer?.email}
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[color:var(--surface)] flex">
      <aside className="hidden lg:flex flex-col w-64 bg-[color:var(--surface-2)] border-r border-[color:var(--border)] flex-shrink-0">
        <SidebarBody />
      </aside>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60" onClick={() => setMobileOpen(false)}>
          <aside
            className="absolute left-0 top-0 bottom-0 w-72 bg-[color:var(--surface-2)] border-r border-[color:var(--border)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarBody />
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0">
        <div className="lg:hidden sticky top-0 z-30 bg-[color:var(--surface)] border-b border-[color:var(--border)] px-4 py-3 flex items-center justify-between">
          <button onClick={() => setMobileOpen(true)} className="p-2 -ml-2 rounded-lg hover:bg-[color:var(--surface-2)]">
            <Menu className="w-5 h-5" />
          </button>
          <div className="font-extrabold text-sm truncate">{storeInfo?.name || 'My Store'}</div>
          <div className="w-9" />
        </div>

        <div className="px-4 py-5 sm:px-6 sm:py-7 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
