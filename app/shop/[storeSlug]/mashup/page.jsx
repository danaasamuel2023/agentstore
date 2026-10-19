'use client';

/**
 * MashUp packs — data, calls and SMS together, on MTN.
 *
 * Three things shape this page, and all three are different from the bundle
 * pages next door.
 *
 *   A pack is not a size. Each one carries data AND on-net minutes AND off-net
 *   minutes AND SMS, and the list is not ordered by any single one of them —
 *   the ₵50 pack holds less data than the ₵40 one but far more minutes. So
 *   every component is on every card. Sorting or labelling by GB would make
 *   half the list look like a mistake.
 *
 *   Delivery is not instant. A pack is loaded through our fast lane and
 *   usually lands within the hour, so the page says so before the customer
 *   pays rather than letting them refresh a dead screen afterwards.
 *
 *   Availability is platform-wide, not per shop. The page asks the server
 *   every time it loads and the server asks again before it will take money,
 *   so a tab left open while packs were paused cannot start a payment.
 */

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, AlertCircle, Clock, Phone, MessageSquare, Database, ArrowLeft } from 'lucide-react';

const API_BASE = 'https://api.datamartgh.shop/api/v1/agent-stores';

/** 511 MB reads better as "511 MB"; 8079 MB reads better as "7.89 GB". */
const dataLabel = (mb) => (mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb} MB`);

export default function MashupPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.storeSlug;

  const [products, setProducts] = useState(null);   // null = still loading
  const [available, setAvailable] = useState(true);
  const [picked, setPicked] = useState(null);       // comboCost
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

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
          setError('We could not load the packs. Check your connection and try again.');
        }
      }
    })();
    return () => { dead = true; };
  }, [slug]);

  const buy = async (e) => {
    e.preventDefault();
    setError('');

    if (picked == null) return setError('Choose a pack first.');
    const clean = phone.replace(/\s/g, '');
    if (!/^(0\d{9}|233\d{9})$/.test(clean)) {
      return setError('Enter a valid MTN number, e.g. 024 123 4567.');
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address.');

    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/stores/${slug}/mashup/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comboCost: picked,
          phoneNumber: clean,
          customerEmail: email.trim().toLowerCase(),
          // Back to the shop's normal payment screen: a MashUp order is an
          // ordinary store order once it is paid for, and that page already
          // knows how to show one.
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
    } finally {
      setBusy(false);
    }
  };

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
          {available
            ? 'This shop sells data bundles. Have a look at those instead.'
            : 'Packs are paused at the moment. Data bundles are still on sale.'}
        </p>
        <button onClick={() => router.push(`/shop/${slug}/products`)} className="btn-brand mt-6">
          Browse bundles
        </button>
      </main>
    );
  }

  const chosen = products.find((p) => p.comboCost === picked);

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">MashUp packs</h1>
      <p className="mt-1 text-[14px] text-ink-3">
        Data, calls and SMS in one pack, for any MTN number. Valid 30 days.
      </p>

      {error && (
        <div className="mt-6 flex items-start gap-2 rounded-xl border border-hairline bg-[color-mix(in_srgb,var(--bad)_8%,transparent)] p-4 text-[14px] text-bad">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Every component on every card: the list is not ordered by any one of
          them, so a customer cannot compare two packs on price alone. */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {products.map((p) => {
          const on = picked === p.comboCost;
          return (
            <button
              key={p.comboCost}
              type="button"
              onClick={() => setPicked(p.comboCost)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                on ? 'border-[var(--brand)]' : 'border-hairline hover:border-ink-4'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="font-semibold text-ink">{dataLabel(p.mb)}</div>
                <span className="num shrink-0 font-semibold text-ink">
                  GH₵{Number(p.sellingPrice).toFixed(2)}
                </span>
              </div>
              <div className="mt-2 space-y-1 text-[12.5px] text-ink-3">
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  {p.onnetMins} min on MTN · {p.offnetMins} min to other networks
                </div>
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                  {p.sms} SMS
                </div>
                <div className="flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 shrink-0" />
                  {dataLabel(p.mb)} data · {p.validityDays} days
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <form onSubmit={buy} className="mt-8 space-y-4">
        <Input
          label="MTN number"
          value={phone}
          onChange={setPhone}
          placeholder="024 123 4567"
          inputMode="tel"
          autoComplete="tel"
          hint="The pack is loaded onto this number."
        />
        <Input
          label="Email"
          value={email}
          onChange={setEmail}
          placeholder="you@example.com"
          type="email"
          autoComplete="email"
          hint="Your payment receipt goes here."
        />

        <div className="flex items-center justify-between rounded-xl border border-hairline p-4">
          <span className="text-[14px] text-ink-3">Total</span>
          <span className="num text-lg font-semibold text-ink">
            GH₵{chosen ? Number(chosen.sellingPrice).toFixed(2) : '0.00'}
          </span>
        </div>

        <button type="submit" disabled={busy || !chosen} className="btn-brand w-full">
          {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Pay now'}
        </button>

        {/* Said BEFORE paying, not after. A pack goes through one shared lane,
            so "instant" would be a promise this cannot keep. */}
        <p className="flex items-center justify-center gap-1.5 text-center text-[12px] text-ink-4">
          <Clock className="h-3 w-3" />
          Packs are loaded through our fast lane — usually within the hour, not instantly.
        </p>
      </form>

      <button
        onClick={() => router.push(`/shop/${slug}`)}
        className="mt-8 inline-flex items-center gap-2 text-[14px] text-ink-3 hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" /> Back to the shop
      </button>
    </main>
  );
}

function Input({ label, value, onChange, hint, ...rest }) {
  return (
    <div>
      <label className="eyebrow mb-1.5 block">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-hairline bg-transparent px-3 py-2.5 text-[14px] text-ink outline-none focus:border-[var(--brand)]"
        {...rest}
      />
      {hint && <p className="mt-1 text-[12px] text-ink-4">{hint}</p>}
    </div>
  );
}
