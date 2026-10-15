'use client';

/**
 * Reseller Products tab — list every product on the agent's store with
 * inline price editor + in-stock/active toggles. Server enforces the
 * below-cost floor; we mirror it client-side for fast feedback.
 *
 * Endpoint: GET /api/subagent-portal/products
 *           PUT /api/subagent-portal/products/:id/price
 *           PUT /api/subagent-portal/products/:id/toggle
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Pencil, Check, X as XIcon, Package } from 'lucide-react';
import { storePortal } from '@/lib/fullstore/api';

const PLATFORM_SLUG = 'databundle';

const ghs = (n) => `GH₵${Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const NETWORKS = ['ALL', 'YELLO', 'TELECEL', 'AT_PREMIUM'];
const networkLabel = (n) => n === 'YELLO' ? 'MTN' : n === 'AT_PREMIUM' ? 'AirtelTigo' : n.charAt(0) + n.slice(1).toLowerCase();

export default function ProductsPage() {
  const params = useParams();
  const slug = params?.storeSlug || PLATFORM_SLUG;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [rowError, setRowError] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    let stopped = false;
    (async () => {
      try {
        const r = await storePortal.myStoreProducts(slug);
        if (!stopped) setProducts(r?.data || []);
      } catch (err) {
        if (!stopped) setToast({ type: 'error', msg: err.message || 'Failed to load products' });
      } finally {
        if (!stopped) setLoading(false);
      }
    })();
    return () => { stopped = true; };
  }, [slug]);

  const visible = filter === 'ALL' ? products : products.filter(p => p.network === filter);

  const startEdit = (p) => {
    setRowError(null);
    setEditingId(p._id);
    setDraft(String(p.sellingPrice ?? ''));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft('');
    setRowError(null);
  };

  const savePrice = async (p) => {
    const next = Number(draft);
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
    setSavingId(p._id);
    setRowError(null);
    try {
      const r = await storePortal.myStoreUpdateProduct(slug, p._id, { sellingPrice: next });
      const fresh = r?.data || {};
      setProducts(arr => arr.map(x => x._id === p._id
        ? { ...x, sellingPrice: fresh.sellingPrice ?? next, profit: fresh.profit ?? +(next - p.basePrice).toFixed(2) }
        : x));
      cancelEdit();
      setToast({ type: 'success', msg: 'Price updated' });
      setTimeout(() => setToast(null), 2500);
    } catch (err) {
      setRowError(err.message || 'Save failed');
    } finally {
      setSavingId(null);
    }
  };

  const toggleActive = async (p) => {
    setSavingId(p._id);
    try {
      const next = !p.isActive;
      setProducts(arr => arr.map(x => x._id === p._id ? { ...x, isActive: next } : x));
      await storePortal.myStoreUpdateProduct(slug, p._id, { isActive: next });
    } catch (err) {
      setProducts(arr => arr.map(x => x._id === p._id ? { ...x, isActive: p.isActive } : x));
      setToast({ type: 'error', msg: err.message || 'Toggle failed' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Products</h1>
        <p className="text-[13px] text-[color:var(--ink-mute)] mt-0.5">
          Tap any price to edit. Your profit = selling price − cost. You can't sell below cost.
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {NETWORKS.map(n => (
          <button
            key={n}
            onClick={() => setFilter(n)}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold whitespace-nowrap border ${
              filter === n
                ? 'border-[color:var(--brand)] bg-[color:var(--brand)]/10 text-[color:var(--brand-deep)]'
                : 'border-[color:var(--border)] text-[color:var(--ink-mute)] hover:text-[color:var(--ink)]'
            }`}
          >
            {n === 'ALL' ? 'All' : networkLabel(n)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-10 flex items-center justify-center text-[color:var(--ink-faint)]">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : visible.length === 0 ? (
        <div className="card p-10 text-center">
          <Package className="w-8 h-8 mx-auto text-[color:var(--ink-faint)] mb-2" />
          <p className="text-[13px] text-[color:var(--ink-mute)]">No products on this store yet.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead className="bg-[color:var(--surface-2)] text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)]">
              <tr>
                <th className="text-left px-3 py-3 font-bold">Bundle</th>
                <th className="text-right px-3 py-3 font-bold">Cost</th>
                <th className="text-right px-3 py-3 font-bold">Sells for</th>
                <th className="text-right px-3 py-3 font-bold">Profit</th>
                <th className="text-center px-3 py-3 font-bold">Active</th>
              </tr>
            </thead>
            <tbody>
              {visible.map(p => {
                const isEditing = editingId === p._id;
                const draftNum = Number(draft);
                const draftValid = Number.isFinite(draftNum) && draftNum > 0;
                const draftProfit = draftValid ? draftNum - Number(p.basePrice || 0) : 0;
                return (
                  <tr key={p._id} className="border-t border-[color:var(--border)] hover:bg-[color:var(--surface-2)]/40 align-middle">
                    <td className="px-3 py-3 whitespace-nowrap font-semibold">
                      {p.capacity}GB <span className="text-[color:var(--ink-mute)] font-normal">{networkLabel(p.network)}</span>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-[color:var(--ink-mute)]">{ghs(p.basePrice)}</td>
                    <td className="px-3 py-3 text-right tabular-nums font-semibold">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-[color:var(--ink-mute)] text-[11px]">GHS</span>
                          <input
                            type="number"
                            step="0.01"
                            value={draft}
                            autoFocus
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') savePrice(p);
                              else if (e.key === 'Escape') cancelEdit();
                            }}
                            className="w-20 px-2 py-1 border border-[color:var(--border-strong)] rounded text-right bg-[color:var(--surface)] focus:outline-none focus:border-[color:var(--brand)]"
                          />
                          <button
                            onClick={() => savePrice(p)}
                            disabled={savingId === p._id}
                            className="p-1 rounded text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-40"
                          >
                            {savingId === p._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                          </button>
                          <button onClick={cancelEdit} className="p-1 rounded text-[color:var(--ink-faint)] hover:bg-[color:var(--surface-2)]">
                            <XIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button onClick={() => startEdit(p)} className="inline-flex items-center gap-1 hover:underline">
                          {ghs(p.sellingPrice)}
                          <Pencil className="w-3 h-3 text-[color:var(--ink-faint)]" />
                        </button>
                      )}
                    </td>
                    <td className={`px-3 py-3 text-right tabular-nums ${isEditing && draftValid ? (draftProfit >= 0 ? 'text-green-600' : 'text-red-600') : 'text-green-600'}`}>
                      {ghs(isEditing && draftValid ? draftProfit : (p.profit ?? p.sellingPrice - p.basePrice))}
                    </td>
                    <td className="px-3 py-3 text-center">
                      <button
                        onClick={() => toggleActive(p)}
                        disabled={savingId === p._id || isEditing}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          p.isActive ? 'bg-[color:var(--brand)]' : 'bg-[color:var(--border-strong)]'
                        } disabled:opacity-50`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            p.isActive ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
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

      {toast && (
        <div className={`text-[12px] font-medium rounded-lg px-3 py-2 ${toast.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
