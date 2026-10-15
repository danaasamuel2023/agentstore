'use client';

/**
 * Reseller Withdrawals tab — list past withdrawals + new MoMo request.
 *
 * Endpoints:
 *   GET  /api/subagent-portal/list — past withdrawals + summary
 *   POST /api/subagent-portal/create — new withdrawal (requires withdrawal PIN/OTP)
 *
 * The PIN field is OPTIONAL in the UI. If the server returns PIN_REQUIRED /
 * OTP_REQUIRED on submit, we surface a clear "set up your PIN first" panel
 * with a link to wherever PIN setup lives. We don't try to manage PIN setup
 * inline because it's a separate OTP flow that deserves its own surface.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, Wallet, ArrowRight, X as XIcon, Smartphone, AlertTriangle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { storePortal } from '@/lib/fullstore/api';

const PLATFORM_SLUG = 'databundle';

const ghs = (n) => `GH₵${Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dt = (s) => s ? new Date(s).toLocaleString('en-GH', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const NETWORKS = [
  { value: 'MTN', label: 'MTN MoMo' },
  { value: 'VODAFONE', label: 'Telecel Cash' },
  { value: 'AIRTELTIGO', label: 'AT Money' }
];

const STATUS_STYLES = {
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  processing: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  queued: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  cancelled: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
};

export default function WithdrawalsPage() {
  const params = useParams();
  const slug = params?.storeSlug || PLATFORM_SLUG;
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [maxWithdrawable, setMaxWithdrawable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);

  const refresh = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [list, store] = await Promise.all([
        storePortal.myStoreWithdrawals(slug, { limit: 25 }).catch(() => null),
        storePortal.myStore(slug).catch(() => null)
      ]);
      setRows(list?.data || []);
      setSummary(list?.summary || null);
      if (store?.data?.wallet?.maxWithdrawable !== undefined) {
        setMaxWithdrawable(store.data.wallet.maxWithdrawable);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [slug]);

  // Auto-poll while any withdrawal is in flight so the user sees transitions.
  const pendingCount = rows.filter(r => ['pending', 'processing', 'queued'].includes(r.status)).length;
  useEffect(() => {
    if (pendingCount === 0) return;
    const id = setInterval(() => refresh(true), 10000);
    return () => clearInterval(id);
  }, [pendingCount]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Withdrawals</h1>
          <p className="text-[13px] text-[color:var(--ink-mute)] mt-0.5">
            Send your earnings to your MoMo wallet. Minimum GHS 10.
          </p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="btn btn-primary h-10 px-4 text-[13px]"
        >
          <Wallet className="w-4 h-4" /> New withdrawal
        </button>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-3 gap-3">
          <SummaryCard label="Completed" total={summary.completed?.total || 0} count={summary.completed?.count || 0} tone="success" />
          <SummaryCard label="Pending" total={summary.pending?.total || 0} count={summary.pending?.count || 0} tone="default" />
          <SummaryCard label="Failed" total={summary.failed?.total || 0} count={summary.failed?.count || 0} tone="danger" />
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="card p-10 flex items-center justify-center text-[color:var(--ink-faint)]">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="card p-10 text-center">
          <Wallet className="w-8 h-8 mx-auto text-[color:var(--ink-faint)] mb-2" />
          <p className="text-[13px] text-[color:var(--ink-mute)]">No withdrawals yet. Tap "New withdrawal" to send earnings to MoMo.</p>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="min-w-full text-[13px]">
            <thead className="bg-[color:var(--surface-2)] text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)]">
              <tr>
                <th className="text-left px-3 py-3 font-bold">Date</th>
                <th className="text-right px-3 py-3 font-bold">Amount</th>
                <th className="text-left px-3 py-3 font-bold">To</th>
                <th className="text-center px-3 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(w => (
                <tr key={w._id || w.withdrawalId} className="border-t border-[color:var(--border)] hover:bg-[color:var(--surface-2)]/40">
                  <td className="px-3 py-2.5 whitespace-nowrap text-[color:var(--ink-mute)]">{dt(w.createdAt)}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{ghs(w.requestedAmount || w.amount)}</td>
                  <td className="px-3 py-2.5 text-[color:var(--ink-mute)] font-mono text-[12px]">
                    {w.paymentDetails?.momoNumber || w.paymentDetails?.accountNumber || '—'}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_STYLES[w.status] || 'bg-gray-100 text-gray-700'}`}>
                      {w.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showNew && (
        <NewWithdrawalModal
          maxWithdrawable={maxWithdrawable}
          slug={slug}
          onClose={() => setShowNew(false)}
          onSuccess={() => { setShowNew(false); refresh(); }}
        />
      )}
    </div>
  );
}

function SummaryCard({ label, total, count, tone }) {
  const cls = tone === 'success' ? 'text-green-600 dark:text-green-400'
    : tone === 'danger' ? 'text-red-600 dark:text-red-400'
    : 'text-[color:var(--ink)]';
  return (
    <div className="card p-4">
      <div className="text-[11px] uppercase tracking-wider text-[color:var(--ink-faint)] font-semibold">{label}</div>
      <div className={`text-lg font-black mt-1 ${cls}`}>{ghs(total)}</div>
      <div className="text-[11px] text-[color:var(--ink-mute)]">{count} withdrawal{count === 1 ? '' : 's'}</div>
    </div>
  );
}

function NewWithdrawalModal({ maxWithdrawable, slug, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [momoNetwork, setMomoNetwork] = useState('MTN');
  const [momoNumber, setMomoNumber] = useState('');
  const [momoName, setMomoName] = useState('');
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Track whether the server told us PIN is required so we surface the field
  // clearly. We could keep it always visible; this lets first-attempt UX be
  // PIN-free, with PIN only requested when actually needed.
  const [pinNeeded, setPinNeeded] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) { setError({ msg: 'Enter a valid amount' }); return; }
    if (n < 10) { setError({ msg: 'Minimum withdrawal is GHS 10' }); return; }
    if (typeof maxWithdrawable === 'number' && n > maxWithdrawable) {
      setError({ msg: `Above your max withdrawable (${ghs(maxWithdrawable)})` });
      return;
    }
    if (!momoNumber || momoNumber.replace(/\D/g, '').length < 10) {
      setError({ msg: 'Enter a valid MoMo number' }); return;
    }
    if (!momoName.trim()) { setError({ msg: "Enter the MoMo account holder's name" }); return; }

    setBusy(true);
    try {
      const res = await storePortal.myStoreWithdraw(slug, {
        amount: n,
        momoNetwork,
        momoNumber: momoNumber.trim(),
        momoName: momoName.trim(),
        // Include the PIN when the user supplied one (the server surfaces
        // PIN_REQUIRED/OTP_REQUIRED). Previously collected but never sent,
        // so a PIN-gated withdrawal could never be authorized.
        ...(pin.trim() ? { pin: pin.trim() } : {})
      });
      setSuccess({
        id: res?.data?.withdrawal?.withdrawalId,
        message: res?.message || 'Withdrawal queued — we\'ll send it to MoMo shortly.'
      });
      setTimeout(onSuccess, 2000);
    } catch (err) {
      // Surface server codes we can act on.
      const code = err.code || (err.message?.includes('PIN required') ? 'PIN_REQUIRED'
        : err.message?.includes('OTP required') ? 'OTP_REQUIRED' : null);
      if (code === 'PIN_REQUIRED' || code === 'OTP_REQUIRED' || err.message?.toLowerCase().includes('pin')) {
        setPinNeeded(true);
        setError({ msg: err.message, code, hint: 'Enter your withdrawal PIN below to authorize this transfer.' });
      } else if (err.message?.toLowerCase().includes('insufficient')) {
        setError({ msg: 'Insufficient balance. Your available wallet is too low for this amount.' });
      } else {
        setError({ msg: err.message || 'Withdrawal failed' });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[color:var(--surface)] rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-[color:var(--border)] flex items-center justify-between flex-shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-bold">New Withdrawal</h2>
            <p className="text-[11px] text-[color:var(--ink-faint)]">
              {maxWithdrawable !== null ? `Max: ${ghs(maxWithdrawable)}` : 'Sends to your MoMo'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[color:var(--surface-2)]">
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {success ? (
          <div className="p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold mb-1">Submitted!</h3>
            <p className="text-[13px] text-[color:var(--ink-mute)]">{success.message}</p>
            {success.id && (
              <p className="text-[11px] text-[color:var(--ink-faint)] mt-2 font-mono">Ref: {success.id}</p>
            )}
          </div>
        ) : (
          <form onSubmit={submit} className="flex-1 overflow-y-auto p-4 space-y-3">
            <label className="block">
              <span className="block text-[12px] font-semibold text-[color:var(--ink-mute)] mb-1.5">Amount (GHS)</span>
              <input
                type="number"
                step="0.01"
                min="10"
                max={maxWithdrawable || undefined}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="input"
                required
              />
              <p className="text-[10px] text-[color:var(--ink-faint)] mt-1">
                Minimum GHS 10. {maxWithdrawable !== null && `You can withdraw up to ${ghs(maxWithdrawable)} right now.`}
              </p>
            </label>

            <label className="block">
              <span className="block text-[12px] font-semibold text-[color:var(--ink-mute)] mb-1.5">MoMo Network</span>
              <div className="grid grid-cols-3 gap-2">
                {NETWORKS.map(n => (
                  <button
                    key={n.value}
                    type="button"
                    onClick={() => setMomoNetwork(n.value)}
                    className={`px-2 py-2 rounded-lg text-[11px] font-bold border ${
                      momoNetwork === n.value
                        ? 'border-[color:var(--brand)] bg-[color:var(--brand)]/10 text-[color:var(--brand-deep)]'
                        : 'border-[color:var(--border)] text-[color:var(--ink-mute)]'
                    }`}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </label>

            <label className="block">
              <span className="block text-[12px] font-semibold text-[color:var(--ink-mute)] mb-1.5">MoMo Number</span>
              <input
                type="tel"
                value={momoNumber}
                onChange={(e) => setMomoNumber(e.target.value)}
                placeholder="024XXXXXXX"
                className="input"
                required
              />
            </label>

            <label className="block">
              <span className="block text-[12px] font-semibold text-[color:var(--ink-mute)] mb-1.5">Account Holder Name</span>
              <input
                type="text"
                value={momoName}
                onChange={(e) => setMomoName(e.target.value)}
                placeholder="As registered on MoMo"
                className="input"
                required
              />
            </label>

            {pinNeeded && (
              <label className="block">
                <span className="block text-[12px] font-semibold text-[color:var(--ink-mute)] mb-1.5">
                  Withdrawal PIN
                </span>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••"
                  autoFocus
                  className="input font-mono"
                />
                <p className="text-[10px] text-[color:var(--ink-faint)] mt-1">
                  If you haven't set up a PIN yet, contact support — PIN setup is in flight.
                </p>
              </label>
            )}

            {error && (
              <div className="text-[12px] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400 rounded-xl px-3 py-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">{error.msg}</div>
                    {error.hint && <div className="mt-1 text-[11px]">{error.hint}</div>}
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="btn btn-primary w-full justify-center text-[14px] py-3 disabled:opacity-60"
            >
              {busy ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</> : <>Send to MoMo <ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
