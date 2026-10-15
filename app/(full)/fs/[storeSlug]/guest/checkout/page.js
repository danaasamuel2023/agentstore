'use client';

/**
 * Guest checkout — visitors buy a single bundle without registering.
 *
 * Flow:
 *   1. Storefront bundle CTAs land here with ?network=YELLO&capacity=2
 *   2. Visitor enters: recipient phone, their email, their phone, name (opt)
 *   3. POST /guest/initiate → Paystack authorizationUrl → window.location
 *   4. Paystack redirects to /guest/return?ref=... after payment
 *
 * No customer wallet, no account, no OTP. The store's allowGuestCheckout
 * flag gates this whole flow on the backend.
 */

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, Smartphone, ShieldCheck, ArrowRight, AlertCircle,
  Mail, User, Phone, Lock
} from 'lucide-react';
import { storePortal } from '@/lib/fullstore/api';
import { formatGhs, NETWORK_LABEL } from '@/lib/fullstore/format';
import { storeHref } from '@/lib/fullstore/links';
import { NetworkIcon } from '@/components/fullstore/NetworkIcon';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://api.datamartgh.shop';

function normalisePhone(raw) {
  const d = String(raw || '').replace(/\D/g, '');
  if (d.length === 10 && d.startsWith('0')) return d;
  if (d.length === 12 && d.startsWith('233')) return '0' + d.slice(3);
  if (d.length === 9) return '0' + d;
  return null;
}

function GuestCheckoutInner() {
  const { storeSlug } = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const network = (search.get('network') || '').toUpperCase();
  const capacity = Number(search.get('capacity') || 0);

  const [store, setStore] = useState(null);
  const [product, setProduct] = useState(null);
  const [storeLoading, setStoreLoading] = useState(true);
  const [form, setForm] = useState({
    customerEmail: '',
    customerPhone: '',
    customerName: '',
    recipientPhone: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // ─── Resolve store + product on mount ───
  useEffect(() => {
    let stopped = false;
    (async () => {
      try {
        const ctx = await storePortal.getStoreContext(storeSlug);
        if (stopped) return;
        const s = ctx?.data;
        setStore(s || null);

        if (!s?.allowGuestCheckout) {
          // Guest checkout disabled — bounce to login.
          router.replace(storeHref(storeSlug, '/login'));
          return;
        }

        // Find the chosen bundle.
        if (network && capacity > 0) {
          const cat = await storePortal.catalog(storeSlug);
          const products = cat?.data?.products || [];
          const match = products.find(
            (p) => p.network === network && Number(p.capacity) === capacity
          );
          if (!stopped) setProduct(match || null);
        }
      } catch (err) {
        if (!stopped) setError(err.message || 'Could not load checkout.');
      } finally {
        if (!stopped) setStoreLoading(false);
      }
    })();
    return () => { stopped = true; };
  }, [storeSlug, network, capacity, router]);

  const price = useMemo(() => {
    if (!product) return null;
    if (Number.isFinite(product.guestSellingPrice) && product.guestSellingPrice > 0) {
      return product.guestSellingPrice;
    }
    return product.sellingPrice;
  }, [product]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!network || !capacity) {
      setError('Pick a bundle from the home page to get started.');
      return;
    }
    if (!product) {
      setError('This bundle is not available right now.');
      return;
    }

    const recipientPhone = normalisePhone(form.recipientPhone);
    const customerPhone = normalisePhone(form.customerPhone);
    if (!recipientPhone) { setError('Enter a valid recipient phone (10 digits, starts with 0)'); return; }
    if (!customerPhone) { setError('Enter a valid contact phone'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.customerEmail)) { setError('Enter a valid email'); return; }

    setLoading(true);
    try {
      const idem = crypto.randomUUID();
      const res = await storePortal.initiateGuest(
        storeSlug,
        {
          network,
          capacity,
          recipientPhone,
          customerPhone,
          customerEmail: form.customerEmail.trim().toLowerCase(),
          customerName: form.customerName.trim() || null
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

  if (storeLoading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[color:var(--ink-faint)]" />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <Link
        href={storeHref(storeSlug, '')}
        className="text-[13px] text-[color:var(--ink-mute)] hover:text-[color:var(--ink)] mb-6 inline-block"
      >
        ← Back to bundles
      </Link>

      <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-faint)] font-semibold mb-2">
        Guest checkout
      </div>
      <h1 className="text-3xl font-black tracking-tight">Buy without an account</h1>
      <p className="text-[14px] text-[color:var(--ink-mute)] mt-1.5">
        Pay with Mobile Money via Paystack. Bundle arrives in 1–5 minutes.
      </p>

      {/* Bundle summary */}
      {product && (
        <div className="card p-4 mt-6 flex items-center gap-3">
          <NetworkIcon network={product.network} size={42} />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)] font-semibold">
              {NETWORK_LABEL[product.network] || product.network}
            </div>
            <div className="text-base font-extrabold">{product.capacity}GB</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-[color:var(--ink-faint)] font-semibold">You pay</div>
            <div className="text-lg font-black tabular-nums">{formatGhs(price)}</div>
          </div>
        </div>
      )}

      {!product && (network || capacity) ? (
        <div className="card-soft p-4 mt-6 text-[13px] text-[color:var(--danger)]">
          That bundle isn't available. Pick another from the home page.
        </div>
      ) : null}

      <form onSubmit={submit} className="mt-5 space-y-4">
        {/* Recipient phone — the line that gets the data */}
        <div>
          <label className="text-[12px] font-semibold text-[color:var(--ink-soft)] mb-1.5 block">
            Recipient phone number
          </label>
          <div className="relative">
            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--ink-faint)] pointer-events-none" />
            <input
              type="tel"
              inputMode="numeric"
              value={form.recipientPhone}
              onChange={(e) => setForm({ ...form, recipientPhone: e.target.value })}
              placeholder="024 123 4567"
              required
              className="input pl-12"
            />
          </div>
          <div className="text-[11px] text-[color:var(--ink-faint)] mt-1">The line that receives the data.</div>
        </div>

        {/* Buyer email */}
        <div>
          <label className="text-[12px] font-semibold text-[color:var(--ink-soft)] mb-1.5 block">
            Your email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--ink-faint)] pointer-events-none" />
            <input
              type="email"
              value={form.customerEmail}
              onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
              placeholder="you@example.com"
              required
              className="input pl-12"
            />
          </div>
          <div className="text-[11px] text-[color:var(--ink-faint)] mt-1">Receipt + order updates.</div>
        </div>

        {/* Buyer phone */}
        <div>
          <label className="text-[12px] font-semibold text-[color:var(--ink-soft)] mb-1.5 block">
            Your phone (for support)
          </label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--ink-faint)] pointer-events-none" />
            <input
              type="tel"
              inputMode="numeric"
              value={form.customerPhone}
              onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
              placeholder="024 123 4567"
              required
              className="input pl-12"
            />
          </div>
        </div>

        {/* Optional name */}
        <div>
          <label className="text-[12px] font-semibold text-[color:var(--ink-soft)] mb-1.5 block">
            Your name <span className="text-[color:var(--ink-faint)] font-normal">(optional)</span>
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[color:var(--ink-faint)] pointer-events-none" />
            <input
              type="text"
              value={form.customerName}
              onChange={(e) => setForm({ ...form, customerName: e.target.value })}
              placeholder="Kojo Mensah"
              className="input pl-12"
            />
          </div>
        </div>

        <div className="card-soft p-4 text-[12px] text-[color:var(--ink-mute)] leading-relaxed">
          <div className="flex items-center gap-2 mb-1.5 text-[color:var(--ink)] font-semibold text-[13px]">
            <ShieldCheck className="w-4 h-4 text-[color:var(--brand-deep)]" /> Safe checkout
          </div>
          Paystack handles payment securely — we never see your MoMo PIN.
          <div className="mt-1.5">
            <Lock className="inline w-3 h-3 mr-1 -mt-0.5" />
            Daily cap: <strong>GH₵ 100</strong> per email.
            For higher limits, <Link href={storeHref(storeSlug, '/register')} className="font-semibold underline">create an account</Link>.
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 text-[13px] text-[color:var(--danger)] bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !product}
          className="btn btn-yellow w-full justify-center mt-2 disabled:opacity-60"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Starting Paystack…</>
          ) : (
            <>
              <Smartphone className="w-4 h-4" />
              Pay {price ? formatGhs(price) : ''} <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="text-center text-[12px] text-[color:var(--ink-mute)] pt-1">
          Already have an account?{' '}
          <Link href={storeHref(storeSlug, '/login')} className="font-semibold text-[color:var(--ink)] hover:underline">
            Log in
          </Link>
        </div>
      </form>
    </div>
  );
}

export default function GuestCheckoutPage() {
  return (
    <Suspense fallback={null}>
      <GuestCheckoutInner />
    </Suspense>
  );
}
