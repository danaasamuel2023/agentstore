'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Menu, X, ChevronDown, ChevronRight, Wallet, LogOut, ShoppingBag,
  User, ArrowRight, Plus, Loader2, TrendingUp, TrendingDown, Receipt,
  Settings, ShieldCheck, Users, Package, ArrowDownCircle, Banknote,
  Store, Sparkles
} from 'lucide-react';
import { useAuth } from '@/lib/fullstore/auth';
import { useOwnerAuth } from '@/lib/fullstore/ownerAuth';
import { storePortal } from '@/lib/fullstore/api';
import { formatGhs } from '@/lib/fullstore/format';
import { storeHref, isPlatformSlug } from '@/lib/fullstore/links';
import { LogoMark } from '@/components/fullstore/Logo';
import { ThemeToggle } from '@/components/fullstore/ThemeToggle';

/**
 * Top navigation bar.
 *
 * The balance pattern is borrowed from DataHustle:
 *   - desktop: a chunky yellow balance pill in the header itself
 *   - mobile : a full "balance card" inside the drawer — big balance pill,
 *              today's credits/debits row, quick top-up button
 *
 * Today's totals are computed client-side from the wallet transactions
 * endpoint (no separate today-summary endpoint exists yet), filtered to
 * entries whose createdAt falls within local midnight → now.
 */
export function TopNav({ storeSlug, storeName, ownBrand = null }) {
  const { status, customer, wallet, logout } = useAuth();
  const ownerAuth = useOwnerAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const homeHref = storeHref(storeSlug, '');
  // On the owner subtree, the navbar reflects the owner session instead
  // of the customer one. Outside /owner we keep the customer-focused nav
  // even if an owner session happens to be live in another tab — we
  // don't want owner shortcuts leaking into the shopping experience.
  const onOwnerRoute = typeof pathname === 'string' && pathname.includes(`/${storeSlug}/owner`);
  const ownerActive = onOwnerRoute && ownerAuth.status === 'authed' && !!ownerAuth.owner;

  const handleOwnerLogout = async () => {
    try { await ownerAuth.logout(storeSlug); } catch (_) {}
    router.replace(storeHref(storeSlug, '/owner/login'));
  };

  return (
    <>
      <header className="sticky top-0 z-30 backdrop-blur bg-[color:var(--background)]/85 border-b border-[color:var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Brand */}
          {ownBrand ? (
            <Link href={homeHref} className="flex min-w-0 items-center gap-2 group">
              <StoreMark brand={ownBrand} />
              <div className="min-w-0 leading-tight">
                <div className="truncate text-[15px] font-extrabold tracking-tight text-[color:var(--ink)]">{ownBrand.name}</div>
                {ownerActive && (
                  <div className="text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)] -mt-0.5">Owner</div>
                )}
              </div>
            </Link>
          ) : (
          <Link href={homeHref} className="flex items-center gap-2 group">
            <LogoMark size={32} />
            <div className="leading-tight">
              <div className="text-[15px] font-extrabold tracking-tight">
                <span className="text-[color:var(--ink)]">Data</span>
                <span className="text-[color:var(--brand-deep)]">Bundle</span>
              </div>
              {storeName && !isPlatformSlug(storeSlug) && (
                <div className="text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)] -mt-0.5">
                  {ownerActive ? `${storeName} · Owner` : storeName}
                </div>
              )}
            </div>
          </Link>
          )}

          {/* Desktop right side */}
          <div className="hidden sm:flex items-center gap-2">
            {ownerActive ? (
              <OwnerDesktop
                owner={ownerAuth.owner}
                store={ownerAuth.store}
                storeSlug={storeSlug}
                onLogout={handleOwnerLogout}
              />
            ) : status === 'authed' && customer ? (
              <AuthedDesktop
                customer={customer}
                wallet={wallet}
                storeSlug={storeSlug}
                onLogout={logout}
              />
            ) : status === 'guest' && storeSlug ? (
              <GuestDesktop storeSlug={storeSlug} />
            ) : null}
            <ThemeToggle />
          </div>

          {/* Mobile toggle + burger */}
          <div className="sm:hidden flex items-center gap-1">
            <ThemeToggle />
            <button
              className="ml-1 w-10 h-10 rounded-xl bg-[color:var(--brand)] hover:bg-[color:var(--brand-deep)] text-black flex flex-col items-center justify-center gap-[4px] active:scale-95 transition-all"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <span className="w-5 h-[2.5px] bg-black rounded-full" />
              <span className="w-3.5 h-[2.5px] bg-black rounded-full" />
              <span className="w-5 h-[2.5px] bg-black rounded-full" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer is rendered OUTSIDE the <header> on purpose.
         The header uses `backdrop-blur` which creates a CSS containing
         block for fixed-position descendants — a fixed child of a
         backdrop-filter parent gets clipped/painted inside that parent's
         stacking context. Hoisting the drawer to a sibling of the header
         lets it cover the whole viewport correctly. */}
      <MobileDrawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        storeSlug={storeSlug}
        status={status}
        customer={customer}
        wallet={wallet}
        onLogout={logout}
        ownerActive={ownerActive}
        owner={ownerAuth.owner}
        store={ownerAuth.store}
        onOwnerLogout={handleOwnerLogout}
      />
    </>
  );
}

// ============================================================================
// MobileDrawer — slides in from the right, shows the balance card up top
// (yellow pill + today's credits/debits + top-up) followed by quick links.
// ============================================================================
function MobileDrawer({ open, onClose, storeSlug, status, customer, wallet, onLogout, ownerActive, owner, store, onOwnerLogout }) {
  const authed = status === 'authed' && !!customer;

  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`sm:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <aside
        className={`sm:hidden fixed top-0 right-0 h-full w-[300px] bg-[color:var(--surface)] border-l border-[color:var(--border)] z-50 transition-transform duration-300 ease-out flex flex-col ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[color:var(--border)] flex-shrink-0">
          <span className="text-lg font-bold">Menu</span>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border-strong)] flex items-center justify-center hover:bg-[color:var(--border)] active:scale-95 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-3">
          {ownerActive ? (
            <OwnerDrawerBody
              owner={owner}
              store={store}
              storeSlug={storeSlug}
              onClose={onClose}
              onLogout={onOwnerLogout}
            />
          ) : authed ? (
            <>
              <WalletCard
                wallet={wallet}
                customer={customer}
                storeSlug={storeSlug}
                drawerOpen={open}
                onNavigate={onClose}
              />

              <NavItem
                icon={ShoppingBag}
                label="Orders"
                href={storeHref(storeSlug, '/account/orders')}
                onClick={onClose}
              />
              <NavItem
                icon={Receipt}
                label="Transactions"
                href={storeHref(storeSlug, '/account/wallet')}
                onClick={onClose}
              />
              <NavItem
                icon={User}
                label="My account"
                href={storeHref(storeSlug, '/account')}
                onClick={onClose}
              />
              <NavItem
                icon={Settings}
                label="Profile settings"
                href={storeHref(storeSlug, '/account/profile')}
                onClick={onClose}
              />

              {/* MY STORE SECTION — surfaced once the customer has spun up
                  their own store via /start-selling. Direct deep-links into
                  the reseller dashboard so common management actions are
                  one tap away from anywhere. Customers without a store
                  see a single "Start selling" call-to-action instead. */}
              {customer?.ownedStoreId ? (
                <>
                  <div className="px-3 pt-4 pb-1 text-[10px] uppercase tracking-wider font-bold text-[color:var(--ink-faint)]">
                    My Store
                  </div>
                  <NavItem
                    icon={Store}
                    label="Dashboard"
                    href="/reseller"
                    onClick={onClose}
                  />
                  <NavItem
                    icon={Package}
                    label="Products & pricing"
                    href="/reseller/products"
                    onClick={onClose}
                  />
                  <NavItem
                    icon={Banknote}
                    label="Withdrawals"
                    href="/reseller/withdrawals"
                    onClick={onClose}
                  />
                  <NavItem
                    icon={TrendingUp}
                    label="Sales & profit"
                    href="/reseller/statistics"
                    onClick={onClose}
                  />
                </>
              ) : (
                <NavItem
                  icon={Sparkles}
                  label="Start selling"
                  href="/start-selling"
                  onClick={onClose}
                />
              )}

              <button
                onClick={() => { onClose(); onLogout(); }}
                className="nav-item w-full flex items-center gap-3 px-3 py-3 mt-4 rounded-xl text-[color:var(--danger)] hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-[0.98] transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                  <LogOut className="w-4 h-4" />
                </div>
                <span className="flex-1 text-left text-[15px] font-semibold">Sign out</span>
              </button>
            </>
          ) : storeSlug ? (
            <div className="space-y-3 mt-4">
              <Link
                onClick={onClose}
                href={storeHref(storeSlug, '/register')}
                className="btn btn-yellow w-full"
              >
                Create account <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                onClick={onClose}
                href={storeHref(storeSlug, '/login')}
                className="btn btn-ghost w-full"
              >
                Log in
              </Link>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}

// ============================================================================
// WalletCard — DataHustle-style balance card inside the drawer.
// ============================================================================
function WalletCard({ wallet, customer, storeSlug, drawerOpen, onNavigate }) {
  const spendable = wallet?.spendable ?? customer?.walletBalance ?? 0;
  const onHold = wallet?.onHold ?? 0;

  const [today, setToday] = useState({ credits: 0, debits: 0, loaded: false });

  // Compute today's credits + debits from the transactions list. We pull
  // only the first page; today's entries will be at the top since the
  // server returns them newest-first.
  useEffect(() => {
    if (!drawerOpen || !storeSlug) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await storePortal.walletTransactions(storeSlug, { page: 1, limit: 50 });
        if (cancelled) return;
        const txs = res?.data?.transactions || [];
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const startMs = start.getTime();
        let credits = 0;
        let debits = 0;
        for (const t of txs) {
          const when = new Date(t.createdAt).getTime();
          if (when < startMs) continue;
          const amt = Number(t.amount) || 0;
          if (t.type === 'credit') credits += amt;
          else debits += amt;
        }
        setToday({ credits, debits, loaded: true });
      } catch (_) {
        if (!cancelled) setToday((s) => ({ ...s, loaded: true }));
      }
    })();
    return () => { cancelled = true; };
  }, [drawerOpen, storeSlug]);

  return (
    <div className="mb-4 rounded-2xl bg-[color:var(--surface-2)] border-2 border-[color:var(--border)] overflow-hidden">
      {/* Balance pill — the centerpiece */}
      <div className="px-4 pt-4 pb-3 text-center">
        <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[color:var(--ink-faint)]">
          Available balance
        </p>
        <div className="mt-2 flex justify-center">
          <span className="inline-flex items-center px-5 py-2.5 rounded-full bg-[color:var(--brand)] text-black text-2xl font-black tabular-nums">
            {formatGhs(spendable)}
          </span>
        </div>
        {onHold > 0 && (
          <p className="mt-2 text-[11px] text-[color:var(--ink-mute)]">
            +{formatGhs(onHold)} on 24h hold
          </p>
        )}

        {/* Today row */}
        <div className="mt-4 flex items-center justify-between text-[12px] font-bold px-1">
          <span className="text-[color:var(--ink-mute)] uppercase tracking-wider text-[10px]">Today</span>
          <span className="text-[color:var(--success)] tabular-nums inline-flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +{formatGhs(today.credits)}
          </span>
          <span className="text-[color:var(--danger)] tabular-nums inline-flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            −{formatGhs(today.debits)}
          </span>
        </div>
      </div>

      {/* Top-up CTA — pinned to a brand combo that reads in both themes.
         Light: near-black bg + yellow text. Dark: yellow bg + black text
         (otherwise `bg-[--ink]` flips to a light cream in dark mode and
         leaves yellow-on-cream, which is unreadable). */}
      <Link
        href={storeHref(storeSlug, '/account/wallet/deposit')}
        onClick={onNavigate}
        className="flex items-center justify-center gap-1.5 py-3 bg-[color:var(--ink)] text-[color:var(--brand)] dark:bg-[color:var(--brand)] dark:text-black font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
      >
        <Plus className="w-4 h-4" strokeWidth={2.75} /> Top up wallet
      </Link>

      {/* Profile link */}
      <Link
        href={storeHref(storeSlug, '/account')}
        onClick={onNavigate}
        className="w-full flex items-center justify-between px-4 py-3 border-t border-[color:var(--border)] hover:bg-[color:var(--surface)] transition-colors"
      >
        <span className="font-semibold text-sm truncate">
          {(customer?.name || 'My account').split(' ')[0]}
        </span>
        <ChevronRight className="w-4 h-4 text-[color:var(--ink-faint)]" />
      </Link>
    </div>
  );
}

function NavItem({ icon: Icon, label, href, onClick }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[color:var(--brand-glow)] active:scale-[0.98] transition-all"
    >
      <div className="w-10 h-10 rounded-xl bg-[color:var(--brand-glow)] text-[color:var(--brand-deep)] flex items-center justify-center">
        <Icon className="w-4 h-4" />
      </div>
      <span className="flex-1 text-left text-[15px] font-semibold">{label}</span>
      <ChevronRight className="w-4 h-4 text-[color:var(--ink-faint)]" />
    </Link>
  );
}

// ============================================================================
// GuestDesktop / AuthedDesktop — desktop right-side
// ============================================================================
function GuestDesktop({ storeSlug }) {
  return (
    <>
      <Link
        href={storeHref(storeSlug, '/track')}
        className="hidden sm:inline-flex text-sm font-semibold text-[color:var(--ink-mute)] hover:text-[color:var(--ink)] mr-1"
      >
        Track order
      </Link>
      <Link href={storeHref(storeSlug, '/login')} className="btn btn-ghost">Log in</Link>
      <Link href={storeHref(storeSlug, '/register')} className="btn btn-yellow">
        Create account <ArrowRight className="w-4 h-4" />
      </Link>
    </>
  );
}

function AuthedDesktop({ customer, wallet, storeSlug, onLogout }) {
  const [open, setOpen] = useState(false);
  const balance = wallet?.spendable ?? customer?.walletBalance ?? 0;

  return (
    <>
      {/* Yellow balance pill — DataHustle style. Two sibling links inside
         one rounded container so the top-up button is its own anchor (no
         nested <a> tags). The ring keeps the pill's outline readable in
         light mode where the body bg is near-white and the yellow would
         otherwise blend into it. */}
      <div className="hidden md:inline-flex items-center gap-1.5 pl-3 pr-1 py-1 rounded-full bg-[color:var(--brand)] hover:bg-[color:var(--brand-deep)] text-black ring-1 ring-black/15 dark:ring-white/10 transition-colors">
        <Link
          href={storeHref(storeSlug, '/account/wallet')}
          className="inline-flex items-center gap-1.5"
          title="Open wallet"
        >
          <Wallet className="w-3.5 h-3.5" strokeWidth={2.5} />
          <span className="text-sm font-black tabular-nums">{formatGhs(balance)}</span>
        </Link>
        <Link
          href={storeHref(storeSlug, '/account/wallet/deposit')}
          className="ml-1 w-6 h-6 rounded-full bg-black text-[color:var(--brand)] inline-flex items-center justify-center hover:bg-[#1f1d17] transition-colors"
          aria-label="Top up wallet"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={3} />
        </Link>
      </div>

      {/* Account dropdown */}
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-[color:var(--surface-2)]"
        >
          <div className="w-7 h-7 rounded-full bg-[color:var(--ink)] text-[color:var(--brand)] flex items-center justify-center text-xs font-black">
            {(customer?.name || '?').charAt(0).toUpperCase()}
          </div>
          <span className="text-sm font-semibold max-w-[110px] truncate">{customer?.name}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div
            onMouseLeave={() => setOpen(false)}
            className="absolute right-0 mt-2 w-64 card p-3 shadow-xl"
          >
            {/* Mini balance pill */}
            <div className="px-2 pb-3 mb-2 border-b border-[color:var(--border)] text-center">
              <div className="text-[10px] uppercase tracking-wider font-bold text-[color:var(--ink-faint)]">Available balance</div>
              <div className="mt-1.5 inline-flex items-center px-4 py-1.5 rounded-full bg-[color:var(--brand)] text-black text-lg font-black tabular-nums">
                {formatGhs(balance)}
              </div>
              {wallet?.onHold > 0 && (
                <div className="mt-1 text-[10px] text-[color:var(--ink-mute)]">
                  +{formatGhs(wallet.onHold)} on hold
                </div>
              )}
            </div>

            <Link href={storeHref(storeSlug, '/account/wallet/deposit')} onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold bg-[color:var(--ink)] text-[color:var(--brand)] dark:bg-[color:var(--brand)] dark:text-black hover:opacity-90 mb-1">
              <Plus className="w-4 h-4" strokeWidth={2.75} /> Top up wallet
            </Link>
            <Link href={storeHref(storeSlug, '/account')} onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-[color:var(--surface-2)]">
              <User className="w-4 h-4 text-[color:var(--ink-mute)]" /> My account
            </Link>
            <Link href={storeHref(storeSlug, '/account/orders')} onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-[color:var(--surface-2)]">
              <ShoppingBag className="w-4 h-4 text-[color:var(--ink-mute)]" /> Orders
            </Link>
            <Link href={storeHref(storeSlug, '/account/wallet')} onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-[color:var(--surface-2)]">
              <Receipt className="w-4 h-4 text-[color:var(--ink-mute)]" /> Transactions
            </Link>
            <Link href={storeHref(storeSlug, '/account/profile')} onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-[color:var(--surface-2)]">
              <Settings className="w-4 h-4 text-[color:var(--ink-mute)]" /> Profile settings
            </Link>

            {/* My Store section — appears once they've created one. */}
            {customer?.ownedStoreId ? (
              <>
                <div className="divider my-1" />
                <div className="px-3 pt-1 pb-0.5 text-[10px] uppercase tracking-wider font-bold text-[color:var(--ink-faint)]">My Store</div>
                <Link href="/reseller" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-[color:var(--surface-2)]">
                  <Store className="w-4 h-4 text-[color:var(--ink-mute)]" /> Dashboard
                </Link>
                <Link href="/reseller/products" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-[color:var(--surface-2)]">
                  <Package className="w-4 h-4 text-[color:var(--ink-mute)]" /> Products & pricing
                </Link>
                <Link href="/reseller/withdrawals" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-[color:var(--surface-2)]">
                  <Banknote className="w-4 h-4 text-[color:var(--ink-mute)]" /> Withdrawals
                </Link>
                <Link href="/reseller/statistics" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-[color:var(--surface-2)]">
                  <TrendingUp className="w-4 h-4 text-[color:var(--ink-mute)]" /> Sales & profit
                </Link>
              </>
            ) : (
              <Link href="/start-selling" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold text-[color:var(--brand-deep)] hover:bg-[color:var(--surface-2)]">
                <Sparkles className="w-4 h-4" /> Start selling
              </Link>
            )}

            <div className="divider my-1" />
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-[color:var(--danger)] hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <LogOut className="w-4 h-4" /> Log out
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ============================================================================
// Owner-mode nav — shown when the user is signed in as the OWNER of this
// store (on /owner/*). Identifies the user as the store admin and exposes
// quick links to every section of the dashboard (Orders, Customers,
// Products, Deposits, Wallet, Withdrawals).
// ============================================================================
const OWNER_NAV_ITEMS = [
  { tab: 'transactions', label: 'Orders',       icon: ShoppingBag },
  { tab: 'products',     label: 'Products',     icon: Package },
  { tab: 'customers',    label: 'Customers',    icon: Users },
  { tab: 'deposits',     label: 'Deposits',     icon: ArrowDownCircle },
  { tab: 'wallet',       label: 'Wallet',       icon: Wallet },
  { tab: 'withdrawals',  label: 'Withdrawals',  icon: Banknote }
];

function OwnerDesktop({ owner, store, storeSlug, onLogout }) {
  const [open, setOpen] = useState(false);
  const initial = (owner?.name || 'A').charAt(0).toUpperCase();

  return (
    <>
      {/* Owner badge — chip that doubles as the trigger for the section
         menu. The badge itself screams "you are the admin" so the
         visitor sees it on every page. */}
      <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[color:var(--ink)] text-[color:var(--brand)] text-[11px] font-black uppercase tracking-wider">
        <ShieldCheck className="w-3.5 h-3.5" /> Owner
      </span>

      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full bg-[color:var(--surface-2)] border border-[color:var(--border)] hover:border-[color:var(--ink)] hover:bg-[color:var(--surface)] transition-colors"
        >
          <div className="w-7 h-7 rounded-full bg-[color:var(--ink)] text-[color:var(--brand)] flex items-center justify-center text-xs font-black">
            {initial}
          </div>
          <span className="text-sm font-bold text-[color:var(--ink)] max-w-[110px] truncate">
            {owner?.name || 'Owner'}
          </span>
          <ChevronDown className={`w-3.5 h-3.5 text-[color:var(--ink-mute)] transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div
            onMouseLeave={() => setOpen(false)}
            className="absolute right-0 mt-2 w-64 card p-3 shadow-xl"
          >
            <div className="px-2 pb-3 mb-2 border-b border-[color:var(--border)]">
              <div className="text-[10px] uppercase tracking-wider font-bold text-[color:var(--ink-faint)]">
                Managing
              </div>
              <div className="text-sm font-bold truncate">{store?.name || storeSlug}</div>
              <div className="text-[11px] text-[color:var(--ink-mute)] font-mono truncate">/{storeSlug}</div>
            </div>

            {OWNER_NAV_ITEMS.map((it) => {
              const Icon = it.icon;
              return (
                <Link
                  key={it.tab}
                  href={storeHref(storeSlug, `/owner?tab=${it.tab}`)}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-[color:var(--surface-2)]"
                >
                  <Icon className="w-4 h-4 text-[color:var(--ink-mute)]" /> {it.label}
                </Link>
              );
            })}

            <div className="divider my-1" />
            <button
              onClick={() => { setOpen(false); onLogout(); }}
              className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-[color:var(--danger)] hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <LogOut className="w-4 h-4" /> Sign out
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function OwnerDrawerBody({ owner, store, storeSlug, onClose, onLogout }) {
  return (
    <>
      <div className="mb-4 rounded-2xl bg-[color:var(--ink)] text-white overflow-hidden p-4">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-bold text-[color:var(--brand)]">
          <ShieldCheck className="w-3.5 h-3.5" /> Owner
        </div>
        <div className="mt-2 text-lg font-black leading-tight truncate">{owner?.name || 'Owner'}</div>
        <div className="text-[12px] text-white/70 truncate">{store?.name || storeSlug}</div>
      </div>

      {OWNER_NAV_ITEMS.map((it) => (
        <NavItem
          key={it.tab}
          icon={it.icon}
          label={it.label}
          href={storeHref(storeSlug, `/owner?tab=${it.tab}`)}
          onClick={onClose}
        />
      ))}

      <button
        onClick={() => { onClose(); onLogout(); }}
        className="nav-item w-full flex items-center gap-3 px-3 py-3 mt-4 rounded-xl text-[color:var(--danger)] hover:bg-red-50 dark:hover:bg-red-950/30 active:scale-[0.98] transition-all"
      >
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
          <LogOut className="w-4 h-4" />
        </div>
        <span className="flex-1 text-left text-[15px] font-semibold">Sign out</span>
      </button>
    </>
  );
}

/**
 * A store with its own design shows its own logo (or its initial on the
 * brand colour when there is no logo, or the link does not load).
 */
function StoreMark({ brand }) {
  const [broken, setBroken] = useState(false);
  if (brand.logo && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={brand.logo}
        alt=""
        width={32}
        height={32}
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className="h-8 w-8 shrink-0 rounded-lg object-cover"
      />
    );
  }
  const initial = String(brand.name || '?').trim().charAt(0).toUpperCase() || '?';
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[15px] font-black"
      style={{ background: 'var(--brand)', color: 'var(--brand-ink, #000)' }}
    >
      {initial}
    </span>
  );
}
