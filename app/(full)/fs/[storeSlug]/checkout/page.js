'use client';

/**
 * Wallet-pay checkout for authed customers.
 *
 * Lands here from the storefront bundle cards when guest checkout is OFF
 * (or when an authed customer wants to spend wallet balance). Handles all
 * three auth states:
 *
 *   - loading → spinner
 *   - guest   → bounce to login (preserving ?next so they come back)
 *   - authed  → order summary + phone input + "Pay from wallet" button
 *
 * The backend route (POST /api/store-portal/orders) atomically debits the
 * wallet, creates the DataPurchase row, and the existing delivery pipeline
 * takes it from there. We poll-redirect to /account/orders on success.
 */

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, CheckCircle2, XCircle, Wallet, Smartphone, ArrowRight, ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/lib/fullstore/auth';
import { storePortal } from '@/lib/fullstore/api';
import { formatGhs, NETWORK_LABEL } from '@/lib/fullstore/format';
import { storeHref } from '@/lib/fullstore/links';
import { SpinWin } from '@/components/fullstore/SpinWin';

const NETWORK_PREFIXES = {
  YELLO:      ['024', '054', '055', '059', '053', '023'],
  TELECEL:    ['020', '050'],
  AT_PREMIUM: ['026', '027', '056', '057', '066', '067']
};

function detectNetwork(phone) {
  const cleaned = String(phone || '').replace(/\D/g, '');
  if (cleaned.length < 3) return null;
  const prefix = cleaned.slice(0, 3);
  for (const [net, prefixes] of Object.entries(NETWORK_PREFIXES)) {
    if (prefixes.includes(prefix)) return net;
  }
  return null;
}

function CheckoutInner() {
  const { storeSlug } = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const { status, customer, wallet, refresh } = useAuth();

  const network = (search.get('network') || '').toUpperCase();
  const capacity = Number(search.get('capacity'));
  const productId = search.get('productId') || null;

  const [product, setProduct] = useState(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState('');

  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [insufficient, setInsufficient] = useState(null); // { required, spendable, shortBy }
  const [success, setSuccess] = useState(null);

  // ----- Guest bounce -----
  useEffect(() => {
    if (status !== 'guest') return;
    const next = encodeURIComponent(
      `${storeHref(storeSlug, '/checkout')}?network=${encodeURIComponent(network)}&capacity=${capacity}`
    );
    router.replace(`${storeHref(storeSlug, '/login')}?next=${next}`);
  }, [status, storeSlug, network, capacity, router]);

  // ----- Catalog lookup so we can show price + verify availability -----
  useEffect(() => {
    if (!storeSlug || (!network && !productId) || !capacity) {
      setCatalogLoading(false);
      setCatalogError('Missing bundle details in the link.');
      return;
    }
    let cancelled = false;
    (async () => {
      setCatalogLoading(true);
      const res = await storePortal.catalog(storeSlug);
      if (cancelled) return;
      const products = res?.data?.products || [];
      const found = productId
        ? products.find((p) => String(p._id) === String(productId))
        : products.find((p) => p.network === network && Number(p.capacity) === capacity);
      if (!found) {
        setCatalogError("We couldn't find that bundle on this store anymore.");
      } else if (found.outOfStock || found.inStock === false) {
        setProduct(found);
        setCatalogError('This bundle is currently out of stock.');
      } else {
        setProduct(found);
        setCatalogError('');
      }
      setCatalogLoading(false);
    })();
    return () => { cancelled = true; };
  }, [storeSlug, network, capacity, productId]);

  const spendable = wallet?.spendable ?? customer?.walletBalance ?? 0;
  const price = product?.sellingPrice ?? 0;
  const networkLabel = NETWORK_LABEL[product?.network || network] || product?.network || network;

  const phoneNetwork = useMemo(() => detectNetwork(phone), [phone]);
  const phoneOk = phone.replace(/\D/g, '').length === 10;
  const phoneWrongNetwork =
    phoneOk && phoneNetwork && product?.network && phoneNetwork !== product.network;

  const canSubmit =
    !submitting && product && phoneOk && !phoneWrongNetwork && spendable >= price && !success;

  const submit = useCallback(async (e) => {
    e?.preventDefault?.();
    if (!product || !phoneOk) return;
    setSubmitting(true);
    setOrderError('');
    setInsufficient(null);
    try {
      const res = await storePortal.placeOrder(storeSlug, {
        phoneNumber: phone,
        productId: product._id,
        network: product.network,
        capacity: product.capacity
      });
      const order = res?.data?.order || res?.data || {};
      setSuccess({
        reference: order.reference || order.referenceNumber || null,
        orderId: order._id || order.id || null,
        phone
      });
      // Refresh wallet/customer state so the topbar balance updates
      try { await refresh(); } catch (_) {}
      // Stay on the success screen: a paid order may have earned a spin.
    } catch (err) {
      if (err?.code === 'INSUFFICIENT_BALANCE' || err?.status === 402) {
        const data = err?.data?.data || {};
        setInsufficient({
          required: data.required ?? price,
          spendable: data.spendable ?? spendable,
          shortBy: Math.max(0, (data.required ?? price) - (data.spendable ?? spendable))
        });
      } else if (err?.code === 'PHONE_NETWORK_MISMATCH') {
        setOrderError(`This number isn't on ${networkLabel}. Double-check and try again.`);
      } else if (err?.code === 'DUPLICATE_PENDING') {
        setOrderError('You already placed this exact order in the last minute. Wait for it to finish.');
      } else {
        setOrderError(err?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [product, phone, phoneOk, storeSlug, refresh, router, networkLabel, price, spendable]);

  // ----- States -----
  if (status === 'loading' || status === 'idle') {
    return <FullPageLoader />;
  }
  if (status === 'guest') {
    return <FullPageLoader />; // redirect fires from the effect above
  }
  if (catalogLoading) {
    return <FullPageLoader />;
  }
  if (catalogError && !product) {
    return (
      <Centered>
        <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto">
          <XCircle className="w-7 h-7 text-[color:var(--danger)]" />
        </div>
        <h2 className="text-2xl font-black mt-4">Bundle unavailable</h2>
        <p className="text-[13px] text-[color:var(--ink-mute)] mt-1">{catalogError}</p>
        <Link href={storeHref(storeSlug, '')} className="btn btn-primary mt-5">
          <ArrowLeft className="w-4 h-4" /> Back to store
        </Link>
      </Centered>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <Link
        href={storeHref(storeSlug, '')}
        className="inline-flex items-center gap-1.5 text-[13px] text-[color:var(--ink-mute)] hover:text-[color:var(--ink)] mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to store
      </Link>

      <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Checkout</h1>
      <p className="text-[13px] text-[color:var(--ink-mute)] mt-1">
        Pay from your wallet — instant delivery to the phone you enter below.
      </p>

      {/* Order summary */}
      <div className="card p-5 mt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)] font-semibold">
              {networkLabel}
            </div>
            <div className="text-xl font-extrabold">{product.capacity}GB</div>
            {product.displayName && (
              <div className="text-[12px] text-[color:var(--ink-mute)] mt-0.5 truncate">
                {product.displayName}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)] font-semibold">Price</div>
            <div className="text-xl font-extrabold tabular-nums">{formatGhs(price)}</div>
          </div>
        </div>
      </div>

      {/* Wallet balance */}
      <div className="mt-3 flex items-center justify-between rounded-xl bg-[color:var(--surface-2)] border border-[color:var(--border)] px-4 py-3">
        <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-[color:var(--ink-mute)]">
          <Wallet className="w-3.5 h-3.5" /> Wallet balance
        </span>
        <span className="text-[14px] font-black tabular-nums">{formatGhs(spendable)}</span>
      </div>

      {/* Form */}
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label className="block text-[12px] uppercase tracking-wider font-semibold text-[color:var(--ink-faint)] mb-2">
            Recipient phone number
          </label>
          <div className="relative">
            <Smartphone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--ink-faint)]" />
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              maxLength={10}
              placeholder="0241234567"
              className="input w-full pl-10"
              autoComplete="tel-national"
              required
            />
          </div>
          {phoneWrongNetwork && (
            <p className="mt-1.5 text-[12px] text-[color:var(--danger)]">
              This number looks like {NETWORK_LABEL[phoneNetwork]} — pick a {networkLabel} number.
            </p>
          )}
        </div>

        {insufficient && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-[13px] text-amber-900">
            Not enough balance — short by{' '}
            <span className="font-black">{formatGhs(insufficient.shortBy)}</span>.{' '}
            <Link
              href={storeHref(storeSlug, '/account/wallet/deposit')}
              className="underline font-bold"
            >
              Top up your wallet
            </Link>{' '}
            and come back.
          </div>
        )}

        {orderError && !insufficient && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-900">
            {orderError}
          </div>
        )}

        {success ? (
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-green-600 mx-auto" />
            <p className="mt-2 font-bold text-green-900">Order placed!</p>
            {success.reference && (
              <p className="text-[12px] text-green-800 mt-0.5">
                Reference: <span className="font-mono">{success.reference}</span>
              </p>
            )}
            <Link href={storeHref(storeSlug, '/account/orders')} className="btn btn-primary mt-3 w-full justify-center">
              See my orders
            </Link>
            <SpinWin reference={success.reference} orderPhone={success.phone} />
          </div>
        ) : (
          <button
            type="submit"
            disabled={!canSubmit}
            className="btn btn-primary w-full justify-center py-3"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Pay {formatGhs(price)} from wallet <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </form>
    </div>
  );
}

function FullPageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-[color:var(--ink-faint)]" />
    </div>
  );
}

function Centered({ children }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-5">
      <div className="card p-8 sm:p-10 max-w-md w-full text-center">{children}</div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <CheckoutInner />
    </Suspense>
  );
}
