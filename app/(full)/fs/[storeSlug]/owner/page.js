'use client';

/**
 * Owner dashboard — every order, deposit, customer, profit number for
 * THIS store. Five sections in a single scroll: KPI cards across the
 * top, then a tab strip switching between Orders, Customers, Deposits
 * and Wallet.
 *
 * Auth: redirects to /{slug}/owner/login when not authed.
 */

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import {
  TrendingUp, ShoppingBag, Users, Wallet, LogOut, RefreshCw,
  CheckCircle2, AlertTriangle, Clock, Banknote, ArrowDownCircle,
  ChevronLeft, ChevronRight, Search, ShieldCheck, Calendar,
  Package, ToggleLeft, ToggleRight, Pencil, X as XIcon, Check,
  Loader2, Smartphone, ArrowRight
} from 'lucide-react';
import { useOwnerAuth } from '@/lib/fullstore/ownerAuth';
import { ownerPortal } from '@/lib/fullstore/api';
import { storeHref } from '@/lib/fullstore/links';

const TABS = [
  { id: 'transactions', label: 'Orders', icon: ShoppingBag },
  { id: 'products',     label: 'Products', icon: Package },
  { id: 'customers',    label: 'Customers', icon: Users },
  { id: 'deposits',     label: 'Deposits', icon: ArrowDownCircle },
  { id: 'wallet',       label: 'Wallet & Profit', icon: Wallet },
  { id: 'withdrawals',  label: 'Withdrawals', icon: Banknote }
];

// MoMo networks offered for withdrawals (matches the reseller portal).
const MOMO_NETWORKS = [
  { value: 'MTN', label: 'MTN MoMo' },
  { value: 'VODAFONE', label: 'Telecel Cash' },
  { value: 'AIRTELTIGO', label: 'AT Money' }
];

const ghs = (n) => `GH₵${Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dt = (s) => s ? new Date(s).toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const d = (s) => s ? new Date(s).toLocaleDateString('en-GH', { dateStyle: 'medium' }) : '—';

export default function OwnerDashboardPage() {
  // Suspense boundary required by Next 15 for useSearchParams() inside the
  // inner component — without it, the build fails the prerender check.
  return (
    <Suspense fallback={null}>
      <OwnerDashboardInner />
    </Suspense>
  );
}

function OwnerDashboardInner() {
  const { storeSlug } = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const { status, owner, store, logout } = useOwnerAuth();

  // Allow ?tab= to deep-link from the owner nav menu in TopNav. The valid
  // ids come from the TABS list above; anything else falls back to Orders.
  const initialTab = (() => {
    const requested = search?.get('tab');
    return TABS.some((t) => t.id === requested) ? requested : 'transactions';
  })();
  const [tab, setTab] = useState(initialTab);

  // Re-sync the tab when the query param changes (in-app navigation).
  useEffect(() => {
    const requested = search?.get('tab');
    if (requested && TABS.some((t) => t.id === requested) && requested !== tab) {
      setTab(requested);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  const [dashboard, setDashboard] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Guard — redirect to login when unauthed.
  useEffect(() => {
    if (status === 'guest') {
      router.replace(storeHref(storeSlug, '/owner/login'));
    }
  }, [status, router, storeSlug]);

  const loadDashboard = useCallback(async () => {
    if (status !== 'authed') return;
    setRefreshing(true);
    try {
      const res = await ownerPortal.dashboard(storeSlug);
      setDashboard(res?.data || null);
    } catch (_) { /* let the section components surface their own errors */ }
    finally { setRefreshing(false); }
  }, [storeSlug, status]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  if (status === 'idle' || status === 'loading' || status === 'guest') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-[color:var(--ink-mute)]">
        <RefreshCw className="w-4 h-4 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-[color:var(--brand)]" />
            <h1 className="text-2xl font-black">Owner dashboard</h1>
          </div>
          <p className="text-[13px] text-[color:var(--ink-mute)]">
            Signed in as <b>{owner?.name}</b> · Managing <b>{store?.name}</b> (/{store?.slug})
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadDashboard}
            disabled={refreshing}
            className="btn btn-ghost h-9 px-3 text-[13px]"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={async () => {
              await logout(storeSlug);
              router.replace(storeHref(storeSlug, '/owner/login'));
            }}
            className="btn btn-ghost h-9 px-3 text-[13px]"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <KpiCards data={dashboard} />

      {/* Tabs */}
      <div className="mt-8 mb-4 border-b border-[color:var(--border)] flex items-center gap-1 overflow-x-auto">
        {TABS.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] font-semibold border-b-2 transition-colors whitespace-nowrap ${
                active
                  ? 'border-[color:var(--brand)] text-[color:var(--ink)]'
                  : 'border-transparent text-[color:var(--ink-mute)] hover:text-[color:var(--ink)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'transactions' && <TransactionsTab slug={storeSlug} />}
      {tab === 'products'     && <ProductsTab slug={storeSlug} />}
      {tab === 'customers'    && <CustomersTab slug={storeSlug} />}
      {tab === 'deposits'     && <DepositsTab slug={storeSlug} storeType={store?.storeType} />}
      {tab === 'wallet'       && <WalletTab slug={storeSlug} />}
      {tab === 'withdrawals'  && <WithdrawalsTab slug={storeSlug} />}
    </div>
  );
}

// ============================================================================
// KPI cards
// ============================================================================
function KpiCards({ data }) {
  const today = data?.today || {};
  const w7    = data?.last7Days || {};
  const w30   = data?.last30Days || {};
  const wallet = data?.wallet || {};

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <Card
        label="Today's revenue"
        value={ghs(today.revenue)}
        sub={`${today.orders || 0} orders`}
        icon={TrendingUp}
        accent="brand"
      />
      <Card
        label="Today's profit"
        value={ghs(today.profit)}
        sub={`${today.completed || 0} completed`}
        icon={CheckCircle2}
        accent="success"
      />
      <Card
        label="7-day revenue"
        value={ghs(w7.revenue)}
        sub={`${w7.orders || 0} orders`}
        icon={Calendar}
      />
      <Card
        label="30-day profit"
        value={ghs(w30.profit)}
        sub={`${w30.completed || 0} done · ${w30.failed || 0} fail`}
        icon={Calendar}
      />
      <Card
        label="Wallet balance"
        value={ghs(wallet.availableBalance)}
        sub={`Lifetime ${ghs(wallet.totalEarnings)}`}
        icon={Wallet}
        accent="success"
      />
    </div>
  );
}

function Card({ label, value, sub, icon: Icon, accent }) {
  const accentClass = accent === 'brand'   ? 'text-[color:var(--brand)]'
                    : accent === 'success' ? 'text-[color:var(--success)]'
                    : 'text-[color:var(--ink-mute)]';
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] uppercase tracking-wider text-[color:var(--ink-faint)] font-semibold">
          {label}
        </span>
        <Icon className={`w-4 h-4 ${accentClass}`} />
      </div>
      <div className="text-xl sm:text-2xl font-black tabular-nums">{value}</div>
      {sub && <div className="text-[11px] text-[color:var(--ink-mute)] mt-0.5">{sub}</div>}
    </div>
  );
}

// ============================================================================
// Transactions tab
// ============================================================================
function TransactionsTab({ slug }) {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [phoneFilter, setPhoneFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const params = { page, limit: 25 };
        if (statusFilter) params.status = statusFilter;
        if (phoneFilter)  params.phone  = phoneFilter;
        const res = await ownerPortal.transactions(slug, params);
        if (!cancelled) {
          setRows(res?.data || []);
          setPagination(res?.pagination || null);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, page, statusFilter, phoneFilter]);

  return (
    <div>
      <FilterBar>
        <select
          value={statusFilter}
          onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
          className="input h-9 text-[13px] pr-8"
        >
          <option value="">All statuses</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <SearchInput value={phoneFilter} onChange={(v) => { setPage(1); setPhoneFilter(v); }} placeholder="Phone" />
      </FilterBar>

      {loading ? <Skeleton /> : error ? <ErrorMsg msg={error} />
        : rows.length === 0 ? <Empty label="No orders yet" />
        : (
          <div className="overflow-x-auto rounded-2xl border border-[color:var(--border)]">
            <table className="min-w-full text-[13px]">
              <thead className="bg-[color:var(--surface-2)] text-[11px] uppercase tracking-wider text-[color:var(--ink-faint)]">
                <tr>
                  <th className="text-left px-3 py-2.5 font-semibold">When</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Bundle</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Phone</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Sold</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Profit</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-[color:var(--border)] hover:bg-[color:var(--surface-2)]/50">
                    <td className="px-3 py-2.5 whitespace-nowrap text-[color:var(--ink-mute)]">{dt(r.createdAt)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-semibold">{r.capacity}GB <span className="text-[color:var(--ink-mute)] font-normal">{r.network}</span></td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-mono text-[12px]">{r.phoneNumber}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{ghs(r.sellingPrice)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[color:var(--success)]">{ghs(r.profit)}</td>
                    <td className="px-3 py-2.5"><StatusPill v={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      <Pagination page={page} pagination={pagination} onChange={setPage} />
    </div>
  );
}

// ============================================================================
// Customers tab
// ============================================================================
function CustomersTab({ slug }) {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await ownerPortal.customers(slug, { page, limit: 25, ...(q ? { q } : {}) });
        if (!cancelled) {
          setRows(res?.data || []);
          setPagination(res?.pagination || null);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, page, q]);

  return (
    <div>
      <FilterBar>
        <SearchInput value={q} onChange={(v) => { setPage(1); setQ(v); }} placeholder="Phone, name or email" />
      </FilterBar>

      {loading ? <Skeleton /> : error ? <ErrorMsg msg={error} />
        : rows.length === 0 ? <Empty label="No customers yet" />
        : (
          <div className="overflow-x-auto rounded-2xl border border-[color:var(--border)]">
            <table className="min-w-full text-[13px]">
              <thead className="bg-[color:var(--surface-2)] text-[11px] uppercase tracking-wider text-[color:var(--ink-faint)]">
                <tr>
                  <th className="text-left px-3 py-2.5 font-semibold">Customer</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Phone</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Orders</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Spent</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Wallet</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((c) => (
                  <tr key={c.id} className="border-t border-[color:var(--border)] hover:bg-[color:var(--surface-2)]/50">
                    <td className="px-3 py-2.5">
                      <div className="font-semibold">{c.name || '—'}</div>
                      {c.email && <div className="text-[11px] text-[color:var(--ink-mute)]">{c.email}</div>}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[12px]">{c.phoneNumber}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{c.orderCount || 0}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{ghs(c.totalSpent)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">
                      {c.kind === 'fullstore' ? ghs(c.walletBalance) : <span className="text-[color:var(--ink-faint)]">—</span>}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-[color:var(--ink-mute)]">{d(c.createdAt || c.lastPurchaseDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      <Pagination page={page} pagination={pagination} onChange={setPage} />
    </div>
  );
}

// ============================================================================
// Deposits tab
// ============================================================================
function DepositsTab({ slug, storeType }) {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await ownerPortal.deposits(slug, { page, limit: 25 });
        if (!cancelled) {
          setRows(res?.data || []);
          setPagination(res?.pagination || null);
          setSummary(res?.summary || null);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug, page]);

  if (storeType !== 'fullstore') {
    return (
      <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 text-center text-[color:var(--ink-mute)]">
        Deposits are tracked only for Full Store accounts. This store doesn't accept customer deposits.
      </div>
    );
  }

  return (
    <div>
      {summary && (
        <div className="mb-4 rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-4 flex items-center justify-between flex-wrap gap-2">
          <div>
            <div className="text-[11px] uppercase tracking-wider text-[color:var(--ink-faint)] font-semibold">Lifetime deposits</div>
            <div className="text-xl font-black tabular-nums">{ghs(summary.total)}</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider text-[color:var(--ink-faint)] font-semibold">Transactions</div>
            <div className="text-xl font-black tabular-nums">{summary.count || 0}</div>
          </div>
        </div>
      )}

      {loading ? <Skeleton /> : error ? <ErrorMsg msg={error} />
        : rows.length === 0 ? <Empty label="No deposits yet" />
        : (
          <div className="overflow-x-auto rounded-2xl border border-[color:var(--border)]">
            <table className="min-w-full text-[13px]">
              <thead className="bg-[color:var(--surface-2)] text-[11px] uppercase tracking-wider text-[color:var(--ink-faint)]">
                <tr>
                  <th className="text-left px-3 py-2.5 font-semibold">When</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Customer</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Amount</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Balance after</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Reference</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-[color:var(--border)] hover:bg-[color:var(--surface-2)]/50">
                    <td className="px-3 py-2.5 whitespace-nowrap text-[color:var(--ink-mute)]">{dt(r.createdAt)}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold">{r.customer?.name || '—'}</div>
                      {r.customer?.email && <div className="text-[11px] text-[color:var(--ink-mute)]">{r.customer.email}</div>}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[color:var(--success)] font-semibold">+{ghs(r.amount)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{ghs(r.balanceAfter)}</td>
                    <td className="px-3 py-2.5 font-mono text-[11px] text-[color:var(--ink-mute)]">{r.reference || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      <Pagination page={page} pagination={pagination} onChange={setPage} />
    </div>
  );
}

// ============================================================================
// Wallet tab
// ============================================================================
function WalletTab({ slug }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await ownerPortal.wallet(slug);
        if (!cancelled) setData(res?.data || null);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) return <Skeleton />;
  if (error) return <ErrorMsg msg={error} />;
  if (!data) return <Empty label="Nothing to show yet" />;

  const w = data.wallet || {};
  const recent = data.recentProfitable || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card label="Available" value={ghs(w.availableBalance)} icon={Wallet} accent="success" />
        <Card label="Pending" value={ghs(w.pendingBalance)} icon={Clock} />
        <Card label="Lifetime earnings" value={ghs(w.totalEarnings)} icon={TrendingUp} accent="brand" />
        <Card label="Lifetime withdrawn" value={ghs(w.totalWithdrawn)} icon={Banknote} />
      </div>

      <div>
        <h3 className="text-[13px] font-bold mb-2">Recent profitable orders</h3>
        {recent.length === 0 ? <Empty label="No completed orders yet" /> : (
          <div className="overflow-x-auto rounded-2xl border border-[color:var(--border)]">
            <table className="min-w-full text-[13px]">
              <thead className="bg-[color:var(--surface-2)] text-[11px] uppercase tracking-wider text-[color:var(--ink-faint)]">
                <tr>
                  <th className="text-left px-3 py-2.5 font-semibold">When</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Bundle</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Sold</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Cost</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Profit</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.reference} className="border-t border-[color:var(--border)]">
                    <td className="px-3 py-2.5 whitespace-nowrap text-[color:var(--ink-mute)]">{dt(r.at)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-semibold">{r.capacity}GB <span className="text-[color:var(--ink-mute)] font-normal">{r.network}</span></td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{ghs(r.sold)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[color:var(--ink-mute)]">{ghs(r.cost)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[color:var(--success)] font-semibold">{ghs(r.profit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Products tab — list + inline in-stock / active toggles. Pricing edits
// deep-link to the DataMart dashboard (price-book floor checks live there).
// ============================================================================
function ProductsTab({ slug }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingId, setSavingId] = useState(null);

  // Inline-edit state — at most one row is being edited at a time so the
  // UI stays focused and we don't ship dueling save attempts.
  const [editingId, setEditingId] = useState(null);
  const [draftPrice, setDraftPrice] = useState('');
  const [rowError, setRowError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ownerPortal.products(slug);
      setRows(res?.data || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const toggle = async (p, field) => {
    setSavingId(p.id);
    try {
      const next = !p[field];
      setRows((arr) => arr.map((x) => x.id === p.id ? { ...x, [field]: next } : x));
      await ownerPortal.updateProduct(slug, p.id, { [field]: next });
    } catch (e) {
      setRows((arr) => arr.map((x) => x.id === p.id ? { ...x, [field]: p[field] } : x));
      alert(e.message || 'Update failed');
    } finally {
      setSavingId(null);
    }
  };

  const startEdit = (p) => {
    setRowError(null);
    setEditingId(p.id);
    setDraftPrice(String(p.sellingPrice ?? ''));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraftPrice('');
    setRowError(null);
  };

  const savePrice = async (p) => {
    const next = Number(draftPrice);
    if (!Number.isFinite(next) || next <= 0) {
      setRowError('Enter a valid price.');
      return;
    }
    if (next < Number(p.basePrice || 0)) {
      setRowError(`Can't go below cost (${ghs(p.basePrice)}).`);
      return;
    }
    if (Math.abs(next - Number(p.sellingPrice)) < 0.005) {
      cancelEdit();
      return;
    }
    setSavingId(p.id);
    setRowError(null);
    try {
      const res = await ownerPortal.updateProduct(slug, p.id, { sellingPrice: next });
      const fresh = res?.data || {};
      setRows((arr) => arr.map((x) => x.id === p.id
        ? { ...x, sellingPrice: fresh.sellingPrice ?? next, profit: fresh.profit ?? +(next - p.basePrice).toFixed(2), belowCost: false }
        : x));
      cancelEdit();
    } catch (e) {
      setRowError(e.message || 'Save failed');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div>
      <div className="mb-3">
        <p className="text-[13px] text-[color:var(--ink-mute)]">
          Tap the price to change it. Selling price can't be below your cost — your profit is the difference.
        </p>
      </div>

      {loading ? <Skeleton /> : error ? <ErrorMsg msg={error} />
        : rows.length === 0 ? <Empty label="No products on this store yet" />
        : (
          <div className="overflow-x-auto rounded-2xl border border-[color:var(--border)]">
            <table className="min-w-full text-[13px]">
              <thead className="bg-[color:var(--surface-2)] text-[11px] uppercase tracking-wider text-[color:var(--ink-faint)]">
                <tr>
                  <th className="text-left px-3 py-2.5 font-semibold">Bundle</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Cost</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Sells for</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Profit</th>
                  <th className="text-center px-3 py-2.5 font-semibold">In stock</th>
                  <th className="text-center px-3 py-2.5 font-semibold">Active</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => {
                  const isEditing = editingId === p.id;
                  const draftNum = Number(draftPrice);
                  const draftValid = Number.isFinite(draftNum) && draftNum > 0;
                  const draftProfit = draftValid ? draftNum - Number(p.basePrice || 0) : 0;
                  return (
                    <tr key={p.id} className="border-t border-[color:var(--border)] hover:bg-[color:var(--surface-2)]/50 align-middle">
                      <td className="px-3 py-2.5 whitespace-nowrap font-semibold">
                        {p.capacity}GB <span className="text-[color:var(--ink-mute)] font-normal">{p.network}</span>
                        {p.belowCost && !isEditing && (
                          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-red-100 text-red-700 font-bold">BELOW COST</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-[color:var(--ink-mute)]">{ghs(p.basePrice)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-semibold">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-[color:var(--ink-mute)] text-[11px]">GHS</span>
                            <input
                              type="number"
                              step="0.01"
                              min={p.basePrice || 0}
                              value={draftPrice}
                              autoFocus
                              onChange={(e) => setDraftPrice(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') savePrice(p);
                                else if (e.key === 'Escape') cancelEdit();
                              }}
                              className="w-20 px-2 py-1 border border-[color:var(--border-strong)] rounded text-right text-[13px] bg-[color:var(--surface)] focus:outline-none focus:border-[color:var(--brand)]"
                            />
                            <button
                              onClick={() => savePrice(p)}
                              disabled={savingId === p.id}
                              className="p-1 rounded text-[color:var(--success)] hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-40"
                              title="Save"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              disabled={savingId === p.id}
                              className="p-1 rounded text-[color:var(--ink-faint)] hover:bg-[color:var(--surface-2)]"
                              title="Cancel"
                            >
                              <XIcon className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(p)}
                            className="inline-flex items-center gap-1 hover:underline"
                            title="Tap to edit"
                          >
                            {ghs(p.sellingPrice)}
                            <Pencil className="w-3 h-3 text-[color:var(--ink-faint)]" />
                          </button>
                        )}
                      </td>
                      <td className={`px-3 py-2.5 text-right tabular-nums ${isEditing ? (draftProfit >= 0 ? 'text-[color:var(--success)]' : 'text-red-600') : 'text-[color:var(--success)]'}`}>
                        {isEditing && draftValid ? ghs(draftProfit) : ghs(p.profit)}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Toggle on={p.inStock} disabled={savingId === p.id || isEditing} onClick={() => toggle(p, 'inStock')} />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <Toggle on={p.isActive} disabled={savingId === p.id || isEditing} onClick={() => toggle(p, 'isActive')} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {rowError && editingId && (
              <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800/50 text-[12px] font-medium text-red-700 dark:text-red-400">
                {rowError}
              </div>
            )}
          </div>
        )}
    </div>
  );
}

function Toggle({ on, disabled, onClick }) {
  const Icon = on ? ToggleRight : ToggleLeft;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg disabled:opacity-50 ${
        on ? 'text-[color:var(--success)]' : 'text-[color:var(--ink-faint)]'
      } hover:bg-[color:var(--surface-2)]`}
      aria-label={on ? 'Turn off' : 'Turn on'}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}

// ============================================================================
// Withdrawals tab — read-only list + deep link to DataMart for new requests.
// The actual withdraw flow requires the withdrawal PIN + multi-provider
// routing that lives only on the main dashboard.
// ============================================================================
function WithdrawalsTab({ slug }) {
  const { store } = useOwnerAuth();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showMomoModal, setShowMomoModal] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ownerPortal.withdrawals(slug, { page, limit: 25 });
      setRows(res?.data || []);
      setPagination(res?.pagination || null);
      setSummary(res?.summary || null);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [slug, page]);

  useEffect(() => { refresh(); }, [refresh]);

  const completed = summary?.completed || { count: 0, total: 0 };
  const pending = summary?.pending || { count: 0, total: 0 };
  const failed = summary?.failed || { count: 0, total: 0 };

  return (
    <div>
      <div className="mb-4 grid sm:grid-cols-2 gap-3">
        <div className="rounded-2xl border border-blue-300/40 bg-blue-50/40 dark:bg-blue-900/10 p-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[13px] font-bold mb-0.5">Move to main wallet</div>
            <div className="text-[12px] text-[color:var(--ink-mute)]">
              Instant, no fee, no PIN needed — funds become spendable in your main account.
            </div>
          </div>
          <button
            onClick={() => setShowWalletModal(true)}
            className="btn btn-primary h-9 px-4 text-[13px] whitespace-nowrap"
          >
            <Wallet className="w-3.5 h-3.5" /> Move
          </button>
        </div>
        <div className="rounded-2xl border border-[color:var(--brand)]/30 bg-[color:var(--brand)]/5 p-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[13px] font-bold mb-0.5">Withdraw to MoMo</div>
            <div className="text-[12px] text-[color:var(--ink-mute)]">
              Send your earnings straight to any MoMo wallet. 1% fee.
            </div>
          </div>
          <button
            onClick={() => setShowMomoModal(true)}
            className="btn btn-primary h-9 px-4 text-[13px] whitespace-nowrap"
          >
            <Smartphone className="w-3.5 h-3.5" /> Withdraw
          </button>
        </div>
      </div>

      {showWalletModal && (
        <WalletTransferOwnerModal
          slug={slug}
          store={store}
          onClose={() => setShowWalletModal(false)}
          onSuccess={() => { setShowWalletModal(false); refresh(); }}
        />
      )}

      {showMomoModal && (
        <MomoWithdrawalOwnerModal
          slug={slug}
          store={store}
          onClose={() => setShowMomoModal(false)}
          onSuccess={() => { setShowMomoModal(false); refresh(); }}
        />
      )}

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Card label="Completed" value={ghs(completed.total)} sub={`${completed.count || 0} withdrawals`} icon={CheckCircle2} accent="success" />
        <Card label="Pending" value={ghs(pending.total)} sub={`${pending.count || 0} in flight`} icon={Clock} />
        <Card label="Failed" value={ghs(failed.total)} sub={`${failed.count || 0} reversed`} icon={AlertTriangle} />
      </div>

      {loading ? <Skeleton /> : error ? <ErrorMsg msg={error} />
        : rows.length === 0 ? <Empty label="No withdrawals yet" />
        : (
          <div className="overflow-x-auto rounded-2xl border border-[color:var(--border)]">
            <table className="min-w-full text-[13px]">
              <thead className="bg-[color:var(--surface-2)] text-[11px] uppercase tracking-wider text-[color:var(--ink-faint)]">
                <tr>
                  <th className="text-left px-3 py-2.5 font-semibold">When</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Amount</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Fee</th>
                  <th className="text-right px-3 py-2.5 font-semibold">Net</th>
                  <th className="text-left px-3 py-2.5 font-semibold">To</th>
                  <th className="text-left px-3 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((w) => (
                  <tr key={w.id} className="border-t border-[color:var(--border)] hover:bg-[color:var(--surface-2)]/50">
                    <td className="px-3 py-2.5 whitespace-nowrap text-[color:var(--ink-mute)]">{dt(w.createdAt)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{ghs(w.amount)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-[color:var(--ink-mute)]">{ghs(w.fee)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{ghs(w.netAmount)}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold">{w.momoName || '—'}</div>
                      <div className="text-[11px] text-[color:var(--ink-mute)] font-mono">{w.momoNumber} · {w.momoNetwork}</div>
                    </td>
                    <td className="px-3 py-2.5"><WithdrawStatusPill v={w.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      <Pagination page={page} pagination={pagination} onChange={setPage} />
    </div>
  );
}

function WalletTransferOwnerModal({ slug, store, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  const available = store?.wallet?.availableBalance || 0;
  const min = store?.withdrawalSettings?.minimumWithdrawal || 10;

  const fillMax = () => setAmount(available > 0 ? available.toFixed(2) : '');

  const canSubmit = () => {
    const n = parseFloat(amount);
    return Number.isFinite(n) && n >= min && n <= available;
  };

  const submit = async () => {
    if (!canSubmit()) {
      setError(`Enter an amount between GH₵${min} and GH₵${available.toFixed(2)}`);
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await ownerPortal.walletWithdraw(slug, { amount: parseFloat(amount) });
      setDone(res?.data || null);
      setTimeout(onSuccess, 1500);
    } catch (e) {
      setError(e.message || 'Could not move funds. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[color:var(--surface)] rounded-2xl p-5 w-full max-w-md border border-[color:var(--border)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-bold flex items-center gap-2">
            <Wallet className="w-4 h-4 text-blue-500" /> Move to Main Wallet
          </h3>
          <button onClick={onClose} disabled={submitting} className="text-[color:var(--ink-mute)] hover:text-[color:var(--ink)]">
            ✕
          </button>
        </div>

        {done ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-10 h-10 text-[color:var(--success)] mx-auto mb-2" />
            <div className="font-bold mb-1">Funds moved</div>
            <div className="text-[13px] text-[color:var(--ink-mute)]">
              GH₵{done.amount?.toFixed(2)} added to your main wallet.
              {typeof done.userWalletBalanceAfter === 'number' && (
                <div className="mt-1">New balance: <b>GH₵{done.userWalletBalanceAfter.toFixed(2)}</b></div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="mb-3 p-3 rounded-lg text-[12px] text-blue-700 bg-blue-50 border border-blue-200">
              Instant, no fee. Funds move from this store's earnings into your main wallet — spend on bundles or withdraw later from the main dashboard.
            </div>

            {error && (
              <div className="mb-3 p-3 rounded-lg text-[13px] text-[color:var(--danger)] bg-red-50 border border-red-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] uppercase tracking-wider text-[color:var(--ink-faint)] font-semibold">Amount (GH₵)</label>
                <button
                  onClick={fillMax}
                  disabled={available <= 0}
                  className="text-[11px] font-bold text-[color:var(--brand)] disabled:opacity-50"
                >
                  Max GH₵{available.toFixed(2)}
                </button>
              </div>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min={min}
                max={available}
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(''); }}
                placeholder={`Min GH₵${min}`}
                disabled={submitting}
                className="input w-full text-lg font-bold"
              />
              <div className="text-[11px] text-[color:var(--ink-mute)] mt-1">
                Available: <b>GH₵{available.toFixed(2)}</b>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={onClose} disabled={submitting} className="btn btn-ghost flex-1 h-10 disabled:opacity-50">
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={submitting || !canSubmit()}
                className="btn btn-primary flex-1 h-10 disabled:opacity-50"
              >
                {submitting ? 'Moving…' : 'Move funds'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Native MoMo withdrawal — queues to the same background worker the main
// dashboard uses, so the owner never leaves this portal.
function MomoWithdrawalOwnerModal({ slug, store, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [network, setNetwork] = useState('MTN');
  const [number, setNumber] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  const available = store?.wallet?.availableBalance || 0;
  const min = store?.withdrawalSettings?.minimumWithdrawal || 10;

  const fillMax = () => setAmount(available > 0 ? available.toFixed(2) : '');

  const submit = async (e) => {
    e?.preventDefault?.();
    const n = parseFloat(amount);
    if (!Number.isFinite(n) || n <= 0) { setError('Enter a valid amount.'); return; }
    if (n < min) { setError(`Minimum withdrawal is GH₵${min}.`); return; }
    if (n > available) { setError(`Above your available balance (GH₵${available.toFixed(2)}).`); return; }
    if (number.replace(/\D/g, '').length < 10) { setError('Enter a valid MoMo number.'); return; }
    if (!name.trim()) { setError("Enter the MoMo account holder's name."); return; }

    setError('');
    setSubmitting(true);
    try {
      const res = await ownerPortal.momoWithdraw(slug, {
        amount: n,
        momoNetwork: network,
        momoNumber: number.trim(),
        momoName: name.trim()
      });
      setDone(res?.data?.withdrawal || null);
      setTimeout(onSuccess, 1800);
    } catch (err) {
      setError(err.message || 'Could not queue your withdrawal. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[color:var(--surface)] rounded-2xl p-5 w-full max-w-md border border-[color:var(--border)] max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[15px] font-bold flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[color:var(--brand)]" /> Withdraw to MoMo
          </h3>
          <button onClick={onClose} disabled={submitting} className="text-[color:var(--ink-mute)] hover:text-[color:var(--ink)]">✕</button>
        </div>

        {done ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-10 h-10 text-[color:var(--success)] mx-auto mb-2" />
            <div className="font-bold mb-1">Withdrawal queued</div>
            <div className="text-[13px] text-[color:var(--ink-mute)]">
              We'll send GH₵{Number(done.netAmount ?? done.requestedAmount ?? 0).toFixed(2)} to your MoMo shortly.
            </div>
            {done.withdrawalId && (
              <div className="text-[11px] text-[color:var(--ink-faint)] mt-2 font-mono">Ref: {done.withdrawalId}</div>
            )}
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-3">
            {error && (
              <div className="p-3 rounded-lg text-[13px] text-[color:var(--danger)] bg-red-50 border border-red-200 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] uppercase tracking-wider text-[color:var(--ink-faint)] font-semibold">Amount (GH₵)</label>
                <button type="button" onClick={fillMax} disabled={available <= 0} className="text-[11px] font-bold text-[color:var(--brand)] disabled:opacity-50">
                  Max GH₵{available.toFixed(2)}
                </button>
              </div>
              <input
                type="number" inputMode="decimal" step="0.01" min={min} max={available}
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError(''); }}
                placeholder={`Min GH₵${min}`}
                disabled={submitting}
                className="input w-full text-lg font-bold"
              />
              <div className="text-[11px] text-[color:var(--ink-mute)] mt-1">
                Available: <b>GH₵{available.toFixed(2)}</b> · 1% fee applies
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[color:var(--ink-faint)] font-semibold mb-1.5">MoMo Network</label>
              <div className="grid grid-cols-3 gap-2">
                {MOMO_NETWORKS.map((nw) => (
                  <button
                    key={nw.value}
                    type="button"
                    onClick={() => setNetwork(nw.value)}
                    className={`px-2 py-2 rounded-lg text-[11px] font-bold border ${
                      network === nw.value
                        ? 'border-[color:var(--brand)] bg-[color:var(--brand)]/10 text-[color:var(--brand-deep)]'
                        : 'border-[color:var(--border)] text-[color:var(--ink-mute)]'
                    }`}
                  >
                    {nw.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[color:var(--ink-faint)] font-semibold mb-1.5">MoMo Number</label>
              <input
                type="tel" value={number}
                onChange={(e) => { setNumber(e.target.value); setError(''); }}
                placeholder="024XXXXXXX" disabled={submitting}
                className="input w-full"
              />
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-[color:var(--ink-faint)] font-semibold mb-1.5">Account Holder Name</label>
              <input
                type="text" value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                placeholder="As registered on MoMo" disabled={submitting}
                className="input w-full"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} disabled={submitting} className="btn btn-ghost flex-1 h-10 disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn btn-primary flex-1 h-10 justify-center disabled:opacity-50">
                {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</> : <>Send to MoMo <ArrowRight className="w-4 h-4" /></>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function WithdrawStatusPill({ v }) {
  const map = {
    completed: { cls: 'bg-green-100 text-green-800', label: 'Completed' },
    pending:   { cls: 'bg-amber-100 text-amber-800', label: 'Pending' },
    processing:{ cls: 'bg-blue-100 text-blue-800', label: 'Processing' },
    queued:    { cls: 'bg-blue-100 text-blue-800', label: 'Queued' },
    failed:    { cls: 'bg-red-100 text-red-800', label: 'Failed' },
    cancelled: { cls: 'bg-gray-200 text-gray-800', label: 'Cancelled' }
  };
  const m = map[v] || { cls: 'bg-gray-200 text-gray-800', label: v || '—' };
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${m.cls}`}>{m.label}</span>;
}

// ============================================================================
// Shared helpers
// ============================================================================
function FilterBar({ children }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">{children}</div>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <span className="relative inline-block">
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--ink-faint)]" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input h-9 pl-9 text-[13px] w-56"
      />
    </span>
  );
}

function Pagination({ page, pagination, onChange }) {
  if (!pagination || pagination.pages <= 1) return null;
  return (
    <div className="mt-3 flex items-center justify-between text-[12px] text-[color:var(--ink-mute)]">
      <div>Page {pagination.page} of {pagination.pages} · {pagination.total.toLocaleString()} total</div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="h-8 px-2.5 rounded-lg border border-[color:var(--border)] hover:bg-[color:var(--surface-2)] disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>
        <button
          onClick={() => onChange(Math.min(pagination.pages, page + 1))}
          disabled={page >= pagination.pages}
          className="h-8 px-2.5 rounded-lg border border-[color:var(--border)] hover:bg-[color:var(--surface-2)] disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
        >
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function StatusPill({ v }) {
  const map = {
    completed: { cls: 'bg-green-100 text-green-800', label: 'Completed' },
    pending:   { cls: 'bg-amber-100 text-amber-800', label: 'Pending' },
    processing:{ cls: 'bg-blue-100 text-blue-800', label: 'Processing' },
    waiting:   { cls: 'bg-amber-100 text-amber-800', label: 'Waiting' },
    failed:    { cls: 'bg-red-100 text-red-800', label: 'Failed' },
    refunded:  { cls: 'bg-gray-200 text-gray-800', label: 'Refunded' }
  };
  const m = map[v] || { cls: 'bg-gray-200 text-gray-800', label: v || '—' };
  return <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${m.cls}`}>{m.label}</span>;
}

function Skeleton() {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] p-8 text-center text-[color:var(--ink-mute)]">
      <RefreshCw className="w-4 h-4 animate-spin inline mr-2" /> Loading…
    </div>
  );
}

function ErrorMsg({ msg }) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-[13px] text-[color:var(--danger)] flex items-center gap-2">
      <AlertTriangle className="w-4 h-4" /> {msg}
    </div>
  );
}

function Empty({ label }) {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--surface)] p-8 text-center text-[color:var(--ink-mute)]">
      {label}
    </div>
  );
}
