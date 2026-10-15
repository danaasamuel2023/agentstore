'use client';

/**
 * Single-screen buy modal.
 *
 * Two paths inside one modal:
 *   - Logged-in customer with enough wallet → "Pay from wallet" (one click,
 *     no MoMo round-trip). Was missing entirely before — every authed user
 *     was being thrown into Paystack as if they were a guest.
 *   - Guest (or authed with low wallet) → Paystack/MoMo flow via
 *     /guest/initiate, same as before.
 *
 * Friction-first for guests:
 *   - Only one required field: recipient phone.
 *   - Email + name live under "More options", hidden by default.
 *   - localStorage("guestCheckoutPrefs") remembers email/name so the next
 *     purchase pre-fills them — the visitor never types twice.
 */

import { useEffect, useRef, useState } from 'react';
import { Loader2, Smartphone, ArrowRight, X, ChevronDown, ShieldCheck, Wallet, Plus, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { storePortal } from '@/lib/fullstore/api';
import { useAuth } from '@/lib/fullstore/auth';
import { storeHref } from '@/lib/fullstore/links';
import { formatGhs, NETWORK_LABEL } from '@/lib/fullstore/format';
import { NetworkIcon } from '@/components/fullstore/NetworkIcon';
import { DeliveryEtaInline } from '@/components/fullstore/DeliveryEta';
import { SpinWin } from '@/components/fullstore/SpinWin';

const PREFS_KEY = 'guestCheckoutPrefs';

function normalisePhone(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  if (d.length === 10 && d.startsWith('0')) return d;
  if (d.length === 12 && d.startsWith('233')) return '0' + d.slice(3);
  if (d.length === 9) return '0' + d;
  return null;
}

export function BundleBuyModal({ storeSlug, product, onClose, hideEta = false }) {
  const router = useRouter();
  const { status: authStatus, customer, wallet, refresh: refreshAuth } = useAuth();
  const isAuthed = authStatus === 'authed';

  const [recipientPhone, setRecipientPhone] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null); // { orderId, recipient, capacity } after wallet pay
  const recipientRef = useRef(null);

  // Pre-fill optional fields from a prior purchase. We open the modal
  // closed by default (showMore=false) — the data is there silently, the
  // visitor just sees the phone field. If they tap "More options" the
  // pre-filled values are already typed in.
  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(PREFS_KEY) : null;
      if (raw) {
        const prefs = JSON.parse(raw);
        if (prefs?.email) setEmail(prefs.email);
        if (prefs?.name) setName(prefs.name);
      }
    } catch {}
    // Autofocus the only required field on open
    const t = setTimeout(() => recipientRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  // Esc closes
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && !loading) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, loading]);

  // Authed customers pay the customer-tier price (sellingPrice);
  // guests pay guestSellingPrice (often slightly higher because guest
  // orders don't earn the agent the same margin).
  const price = (() => {
    if (!product) return null;
    if (isAuthed) {
      return Number.isFinite(product.sellingPrice) ? product.sellingPrice : product.guestSellingPrice;
    }
    if (Number.isFinite(product.guestSellingPrice) && product.guestSellingPrice > 0) {
      return product.guestSellingPrice;
    }
    return product.sellingPrice;
  })();

  const walletBalance = Number(wallet?.spendable ?? wallet?.balance ?? customer?.walletBalance ?? 0);
  const canPayFromWallet = isAuthed && Number.isFinite(price) && walletBalance >= price;

  // ─── Path A: logged-in customer with sufficient wallet ───
  const payFromWallet = async () => {
    setError('');
    const recPhone = normalisePhone(recipientPhone);
    if (!recPhone) {
      setError('Enter a valid phone number (10 digits, starts with 0)');
      return;
    }
    setLoading(true);
    try {
      const res = await storePortal.placeOrder(storeSlug, {
        productId: product._id || product.id,
        network: product.network,
        capacity: product.capacity,
        phoneNumber: recPhone
      });
      const order = res?.data?.order || res?.data;
      setSuccess({
        orderId: order?.id || order?._id || null,
        reference: order?.reference || null,
        recipient: recPhone,
        capacity: product.capacity,
        network: product.network
      });
      try { refreshAuth?.(); } catch (_) {}
    } catch (err) {
      setError(err.message || 'Could not place the order.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Path B: Paystack/MoMo (guest, or authed-but-low-balance) ───
  const payWithMomo = async () => {
    setError('');
    const recPhone = normalisePhone(recipientPhone);
    if (!recPhone) {
      setError('Enter a valid phone number (10 digits, starts with 0)');
      return;
    }
    // Persist optional prefs for next visit — even partial input.
    try {
      const prefs = {};
      if (email.trim()) prefs.email = email.trim().toLowerCase();
      if (name.trim()) prefs.name = name.trim();
      if (Object.keys(prefs).length) {
        window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      }
    } catch {}

    setLoading(true);
    try {
      const idem = (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `idem-${Date.now()}-${Math.random()}`;
      const res = await (isAuthed ? storePortal.initiateMomo : storePortal.initiateGuest)(
        storeSlug,
        {
          network: product.network,
          capacity: product.capacity,
          recipientPhone: recPhone,
          // Pre-fill guest contact info from the logged-in customer
          // when they're paying with MoMo even though they're authed.
          customerEmail: (isAuthed ? customer?.email : email.trim()) || undefined,
          customerName: (isAuthed ? customer?.name : name.trim()) || undefined,
          // returnPath: where Paystack lands the buyer post-payment.
          // Logged-in customers go back to their own account; guests
          // get the existing /guest/return tracking page.
          returnPath: isAuthed
            ? storeHref(storeSlug, '/account/orders')
            : undefined
        },
        idem
      );
      const url = res?.data?.authorizationUrl;
      if (url) {
        window.location.href = url;
        return;
      }
      throw new Error('No payment URL returned');
    } catch (err) {
      setError(err.message || 'Could not start the checkout.');
      setLoading(false);
    }
  };

  // Default form submit: route to whichever path the user qualifies for
  const submit = (e) => {
    e?.preventDefault?.();
    if (canPayFromWallet) return payFromWallet();
    return payWithMomo();
  };

  if (!product) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div className="w-full sm:max-w-md bg-[color:var(--surface)] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden">
        {/* Header bar with network colour */}
        <div className="relative p-5" style={{ background: networkBg(product.network), color: networkInk(product.network) }}>
          <button
            type="button"
            onClick={() => !loading && onClose()}
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/15 hover:bg-black/25 flex items-center justify-center transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <NetworkIcon network={product.network} size={48} />
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-70">
                {NETWORK_LABEL[product.network] || product.network}
              </div>
              <div className="text-3xl font-black leading-none mt-0.5">{product.capacity}GB</div>
            </div>
            <div className="ml-auto text-right">
              <div className="text-[11px] font-bold uppercase tracking-wider opacity-70">You pay</div>
              <div className="text-2xl font-black tabular-nums leading-none mt-0.5">
                {formatGhs(price)}
              </div>
            </div>
          </div>
        </div>

        {success ? (
          <div className="p-6 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-[color:var(--success)]/15 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-8 h-8 text-[color:var(--success)]" />
            </div>
            <h3 className="text-xl font-black mb-1">Order placed</h3>
            <p className="text-[13px] text-[color:var(--ink-mute)] mb-5">
              {product.capacity}GB on its way to <span className="font-semibold text-[color:var(--ink)]">{success.recipient}</span>. Most bundles land within 1–5 minutes.
            </p>
            <div className="mb-4 -mt-2">
              <SpinWin reference={success.reference} orderPhone={success.recipient} />
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => router.push(storeHref(storeSlug, '/account/orders'))}
                className="btn btn-yellow w-full justify-center"
              >
                See order status
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full text-[12px] font-semibold text-[color:var(--ink-mute)] hover:text-[color:var(--ink)] py-1.5"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
        <form onSubmit={submit} className="p-5 space-y-4">
          {/* The only required field */}
          <div>
            <label className="text-[13px] font-bold text-[color:var(--ink)] mb-2 block">
              Phone number to top up
            </label>
            <div className="relative">
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[color:var(--ink-faint)] pointer-events-none" />
              <input
                ref={recipientRef}
                type="tel"
                inputMode="numeric"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="024 123 4567"
                required
                autoFocus
                className="input pl-12 text-base font-semibold"
              />
            </div>
          </div>

          {/* Optional fields — collapsed by default. If we already have
              prefs from a prior purchase, "More options" reads as
              "Edit details" so the visitor knows their info is saved. */}
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className="w-full flex items-center justify-between text-[12px] font-semibold text-[color:var(--ink-mute)] hover:text-[color:var(--ink)] py-1"
          >
            <span>{(email || name) ? 'Edit your details (optional)' : 'Add email & name (optional)'}</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showMore ? 'rotate-180' : ''}`} />
          </button>

          {showMore && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="text-[11px] font-semibold text-[color:var(--ink-soft)] mb-1 block">Email (for receipt)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-[color:var(--ink-soft)] mb-1 block">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Kojo"
                  className="input"
                />
              </div>
            </div>
          )}

          {/* Wallet balance display for authed customers */}
          {isAuthed && (
            <div className={`rounded-xl border p-3 ${canPayFromWallet
              ? 'border-[color:var(--brand-deep)]/30 bg-[color:var(--brand-glow)]'
              : 'border-[color:var(--border)] bg-[color:var(--surface-2)]'}`}
            >
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[color:var(--ink-mute)]" />
                <div className="flex-1">
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-[color:var(--ink-mute)]">Your wallet</div>
                  <div className="text-[15px] font-extrabold tabular-nums">{formatGhs(walletBalance)}</div>
                </div>
                {!canPayFromWallet && (
                  <Link
                    href={storeHref(storeSlug, '/account/wallet/deposit')}
                    className="text-[12px] font-bold text-[color:var(--brand-deep)] hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Top up
                  </Link>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="text-[13px] text-[color:var(--danger)] bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          {/* Live delivery ETA — same buckets as mtnup2u + /orders. Left out
              when the store owner has chosen to hide delivery time. */}
          {!hideEta && (
            <div className="bg-[color:var(--surface-2)] border border-[color:var(--border)] rounded-xl p-3">
              <p className="text-[10px] text-[color:var(--ink-faint)] uppercase font-semibold mb-1 text-center tracking-wider">
                Estimated Delivery
              </p>
              <DeliveryEtaInline />
            </div>
          )}

          {/* Primary CTA:
              - Authed + wallet covers price → Pay from wallet (primary),
                with secondary "or pay with MoMo / top up" links.
              - Authed + wallet short → Pay with MoMo (primary, Paystack
                returns the buyer to /account/orders via returnPath, not
                the guest return page), with a Top-up option.
              - Guest → Pay with MoMo (Paystack → /guest/return). */}
          {canPayFromWallet ? (
            <>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-yellow w-full justify-center text-[15px] py-3 disabled:opacity-60"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Placing order…</>
                ) : (
                  <>Pay {price ? formatGhs(price) : ''} from wallet <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
              <button
                type="button"
                onClick={payWithMomo}
                disabled={loading}
                className="w-full justify-center text-[12px] font-semibold text-[color:var(--ink-mute)] hover:text-[color:var(--ink)] py-1.5 disabled:opacity-50"
              >
                or pay with MoMo instead
              </button>
            </>
          ) : isAuthed ? (
            <>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-yellow w-full justify-center text-[15px] py-3 disabled:opacity-60"
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Starting Paystack…</>
                ) : (
                  <>Pay {price ? formatGhs(price) : ''} with MoMo <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
              <Link
                href={storeHref(storeSlug, '/account/wallet/deposit')}
                className="w-full justify-center text-[12px] font-semibold text-[color:var(--ink-mute)] hover:text-[color:var(--ink)] py-1.5 flex items-center gap-1"
              >
                or top up wallet first
              </Link>
            </>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="btn btn-yellow w-full justify-center text-[15px] py-3 disabled:opacity-60"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Starting Paystack…</>
              ) : (
                <>Pay {price ? formatGhs(price) : ''} with MoMo <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          )}

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-[color:var(--ink-faint)] pt-1">
            <ShieldCheck className="w-3 h-3" />
            {canPayFromWallet ? 'Bundle delivers in 1–5 minutes' : 'Secured by Paystack · we never see your MoMo PIN'}
          </div>
        </form>
        )}
      </div>
    </div>
  );
}

function networkBg(net) {
  if (net === 'YELLO' || net === 'MTN') return '#FFCC00';
  if (net === 'TELECEL') return '#E30613';
  return '#9333EA';
}
function networkInk(net) {
  if (net === 'YELLO' || net === 'MTN') return '#000';
  return '#FFF';
}
