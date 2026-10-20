'use client';

/**
 * MashUp packs — data, calls and SMS together, on MTN.
 *
 * Looks like the MashUp cards on the main site: a yellow MTN card per pack
 * with the price on top and every part of the pack written out (data, MTN
 * minutes, other-network minutes, SMS). Picking a card opens a pop-up with
 * the number and email fields, so the customer never scrolls to find the form.
 *
 *   A pack is not a size. Each one carries data AND minutes AND SMS, and the
 *   list is not ordered by any single one of them, so every part is on every
 *   card.
 *
 *   Delivery is not instant. A pack usually lands within the hour, so the
 *   pop-up says so before the customer pays.
 *
 *   Availability is platform-wide. The page asks the server every time it
 *   loads and the server asks again before it takes money.
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, AlertCircle, Clock, ArrowLeft, X } from 'lucide-react';

const API_BASE = 'https://api.datamartgh.shop/api/v1/agent-stores';

/** 511 MB reads better as "511 MB"; 8079 MB reads better as "7.89 GB". */
const dataLabel = (mb) => (mb >= 1024
  ? `${(mb / 1024).toFixed(2).replace(/\.?0+$/, '')} GB`
  : `${mb} MB`);
const cedis = (n) => `GH₵${Number(n || 0).toFixed(2)}`;

const MTNLogo = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden="true">
    <rect width="80" height="80" rx="16" fill="#FFCC00" />
    <ellipse cx="40" cy="40" rx="30" ry="20" stroke="#000" strokeWidth="3" fill="none" />
    <text x="40" y="46" textAnchor="middle" fontFamily="Arial Black" fontSize="14" fontWeight="900" fill="#000">MTN</text>
  </svg>
);

const Row = ({ label, value }) => (
  <div className="flex items-baseline justify-between gap-2 border-b border-gray-100 py-1.5 last:border-0">
    <span className="text-[11px] text-gray-500">{label}</span>
    <span className="text-xs font-bold tabular-nums text-gray-900">{value}</span>
  </div>
);

const PackRows = ({ p }) => (
  <>
    <Row label="Data" value={dataLabel(p.mb)} />
    <Row label="MTN to MTN minutes" value={`${p.onnetMins} mins`} />
    <Row label="To other networks" value={`${p.offnetMins} mins`} />
    <Row label="SMS" value={`${p.sms} SMS`} />
  </>
);

function PackCard({ p, onPick }) {
  return (
    <button
      type="button"
      onClick={() => onPick(p)}
      className="flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-lg ring-1 ring-black/5 transition-all hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="flex items-baseline justify-between bg-[#FFCC00] px-4 py-3 text-black">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">MTN MashUp</p>
          <p className="text-2xl font-black leading-none">{cedis(p.sellingPrice)}</p>
        </div>
        <span className="rounded-full bg-black/10 px-2 py-0.5 text-[10px] font-bold">{p.validityDays || 30} days</span>
      </div>
      <div className="flex-1 px-4 py-3">
        <PackRows p={p} />
      </div>
      <div className="px-4 pb-4">
        <span className="block w-full rounded-xl bg-[#FFCC00] py-2.5 text-center text-xs font-bold text-black">Buy</span>
      </div>
    </button>
  );
}

function BuyModal({ pack, slug, onClose }) {
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Lock the page behind the pop-up; Escape closes it.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [busy, onClose]);

  const validPhone = /^0\d{9}$/.test(phone);
  const validEmail = /^\S+@\S+\.\S+$/.test(email.trim());

  const pay = async (e) => {
    e.preventDefault();
    setError('');
    if (!validPhone) return setError('Enter a valid MTN number, e.g. 0241234567.');
    if (!validEmail) return setError('Enter a valid email address.');
    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/stores/${slug}/mashup/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comboCost: pack.comboCost,
          phoneNumber: phone,
          customerEmail: email.trim().toLowerCase(),
          // Back to the shop's normal payment screen: once paid, a MashUp
          // order is an ordinary store order and that page knows how to show it.
          callbackUrl: `${window.location.origin}/shop/${slug}/payment/verify`,
        }),
      });
      const j = await r.json();
      if (j.status === 'success' && j.data?.authorizationUrl) {
        window.location.href = j.data.authorizationUrl;
        return;
      }
      setError(j.message || 'We could not start the payment. Please try again.');
    } catch {
      setError('We could not reach the server. Check your connection and try again.');
    }
    setBusy(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
      onClick={() => { if (!busy) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Buy MTN MashUp ${cedis(pack.sellingPrice)}`}
        className="max-h-[92vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between bg-[#FFCC00] px-5 py-4">
          <div className="flex items-center gap-3">
            <MTNLogo size={32} />
            <div>
              <h3 className="text-base font-bold leading-tight text-black">MTN MashUp {cedis(pack.sellingPrice)}</h3>
              <p className="text-[11px] font-semibold text-black/70">Valid {pack.validityDays || 30} days</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-black transition hover:bg-black/20"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>

        <form onSubmit={pay} className="p-5">
          <div className="mb-4 rounded-xl bg-gray-50 px-4 py-3">
            <PackRows p={pack} />
          </div>

          {error && (
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">MTN number</label>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            autoFocus
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            placeholder="0XXXXXXXXX"
            className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-3 text-center text-lg font-bold tracking-wide text-gray-900 placeholder-gray-400 focus:border-[#FFCC00] focus:outline-none focus:ring-1 focus:ring-[#FFCC00]"
          />
          <p className="mb-4 mt-1.5 text-center text-[11px] text-gray-400">
            Check it carefully — a pack sent to a wrong number cannot be recalled.
          </p>

          <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wider text-gray-500">Email</label>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-gray-200 bg-gray-100 px-3 py-3 text-[14px] text-gray-900 placeholder-gray-400 focus:border-[#FFCC00] focus:outline-none focus:ring-1 focus:ring-[#FFCC00]"
          />
          <p className="mb-4 mt-1.5 text-[11px] text-gray-400">Your payment receipt goes here.</p>

          <button
            type="submit"
            disabled={busy || !validPhone || !validEmail}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFCC00] py-3 text-sm font-bold text-black transition-colors hover:bg-[#f5c400] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> Opening payment…</> : `Pay ${cedis(pack.sellingPrice)}`}
          </button>

          {/* Said BEFORE paying, not after: "instant" would be a promise
              this lane cannot keep. */}
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-gray-500">
            <Clock className="h-3 w-3" />
            Packs usually arrive within the hour, not instantly.
          </p>

          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="mt-2 w-full py-2.5 text-xs font-semibold text-gray-500 hover:text-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}

export default function MashupPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.storeSlug;

  const [products, setProducts] = useState(null);   // null = still loading
  const [available, setAvailable] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [picked, setPicked] = useState(null);       // the pack in the pop-up

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/stores/${slug}/mashup`);
        const j = await r.json();
        if (dead) return;
        if (j.status === 'success') {
          setAvailable(j.data.available !== false);
          setProducts(j.data.products || []);
        } else {
          setProducts([]);
        }
      } catch {
        if (!dead) {
          setProducts([]);
          setLoadError('We could not load the packs. Check your connection and try again.');
        }
      }
    })();
    return () => { dead = true; };
  }, [slug]);

  if (products === null) {
    return (
      <main className="mx-auto flex w-full max-w-2xl items-center justify-center px-4 py-24 text-ink-3">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
      </main>
    );
  }

  if (!available || products.length === 0) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-ink">No MashUp packs right now</h1>
        <p className="mt-2 text-[14px] text-ink-3">
          {loadError || (available
            ? 'This shop sells data bundles. Have a look at those instead.'
            : 'Packs are paused at the moment. Data bundles are still on sale.')}
        </p>
        <button onClick={() => router.push(`/shop/${slug}/products`)} className="btn-brand mt-6">
          Browse bundles
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10">
      <div className="mb-6 overflow-hidden rounded-2xl bg-[#FFCC00] p-5 text-black shadow-md">
        <div className="flex items-center gap-3">
          <MTNLogo size={44} />
          <div>
            <h1 className="text-xl font-black leading-tight sm:text-2xl">MTN MashUp packs</h1>
            <p className="mt-0.5 text-[13px] font-semibold text-black/70">
              Data, calls and SMS in one pack, for any MTN number. Valid 30 days.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => (
          <PackCard key={p.comboCost} p={p} onPick={setPicked} />
        ))}
      </div>

      <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-[12px] text-ink-4">
        <Clock className="h-3 w-3" />
        Packs usually arrive within the hour, not instantly.
      </p>

      <button
        onClick={() => router.push(`/shop/${slug}`)}
        className="mt-6 inline-flex items-center gap-2 text-[14px] text-ink-3 hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back to the shop
      </button>

      {picked && <BuyModal pack={picked} slug={slug} onClose={() => setPicked(null)} />}
    </main>
  );
}
