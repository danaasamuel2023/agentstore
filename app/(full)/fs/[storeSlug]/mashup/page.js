'use client';

/**
 * MTN MashUp packs on a full store — data, calls and SMS in one pack.
 *
 * Same server path as the simple shop (cheapdata.shop/shop/<slug>/mashup):
 *   GET  /api/v1/agent-stores/stores/:slug/mashup             → { available, products }
 *   POST /api/v1/agent-stores/stores/:slug/mashup/initialize  → { authorizationUrl }
 * so prices, floors and the platform on/off switch are exactly the simple
 * shop's. Payment is MoMo/card only — there is no wallet path for packs yet.
 *
 * A pack is not a size: each carries data AND minutes AND SMS and the list
 * is not ordered by any one of them, so every part is on every card.
 * Delivery usually takes up to an hour; the page says so before payment.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, AlertCircle, Clock, Phone, MessageSquare, Database, ArrowLeft } from 'lucide-react';
import { storeHref } from '@/lib/fullstore/links';
import { useAuth } from '@/lib/fullstore/auth';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.datamartgh.shop'}/api/v1/agent-stores`;
const dataLabel = (mb) => (mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb} MB`);
const ghs = (n) => `GH₵${Number(n || 0).toFixed(2)}`;

export default function MashupPage() {
  const { storeSlug } = useParams();
  const { customer } = useAuth() || {};

  const [products, setProducts] = useState(null); // null = loading
  const [available, setAvailable] = useState(true);
  const [picked, setPicked] = useState(null);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (customer?.email && !email) setEmail(customer.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customer?.email]);

  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/stores/${encodeURIComponent(storeSlug)}/mashup`);
        const j = await r.json();
        if (dead) return;
        setAvailable(j?.data?.available !== false);
        setProducts(j?.status === 'success' ? j.data.products || [] : []);
      } catch {
        if (!dead) {
          setProducts([]);
          setError('We could not load the packs. Check your connection and try again.');
        }
      }
    })();
    return () => { dead = true; };
  }, [storeSlug]);

  const buy = async (e) => {
    e.preventDefault();
    setError('');
    if (picked == null) return setError('Choose a pack first.');
    const clean = phone.replace(/\s/g, '');
    if (!/^(0\d{9}|233\d{9})$/.test(clean)) return setError('Enter a valid MTN number, e.g. 024 123 4567.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address.');

    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/stores/${encodeURIComponent(storeSlug)}/mashup/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comboCost: picked,
          phoneNumber: clean,
          customerEmail: email.trim().toLowerCase(),
          customerName: customer?.name || undefined,
          // Back to THIS store (works on databundle.shop and on a custom
          // domain — the middleware accepts an already-prefixed path).
          callbackUrl: `${window.location.origin}${storeHref(storeSlug, '/mashup/return')}`,
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
      <div className="min-h-[50vh] flex items-center justify-center text-[color:var(--ink-mute)]">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Loading…
      </div>
    );
  }

  if (!available || products.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-5 py-16 text-center">
        <h1 className="text-xl font-extrabold">No MashUp packs right now</h1>
        <p className="text-[14px] text-[color:var(--ink-mute)] mt-2">
          {available ? 'This store sells data bundles. Have a look at those instead.' : 'Packs are paused at the moment. Data bundles are still on sale.'}
        </p>
        <Link href={storeHref(storeSlug, '')} className="btn btn-primary mt-6 inline-flex">Browse bundles</Link>
      </div>
    );
  }

  const chosen = products.find((p) => p.comboCost === picked);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-2xl font-black">MTN MashUp packs</h1>
      <p className="text-[14px] text-[color:var(--ink-mute)] mt-1">
        Data, calls and SMS in one pack, for any MTN number. Valid 30 days.
      </p>

      {error && (
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-[14px] text-[color:var(--danger)]">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{error}</span>
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {products.map((p) => {
          const on = picked === p.comboCost;
          return (
            <button
              key={p.comboCost}
              type="button"
              onClick={() => setPicked(p.comboCost)}
              aria-pressed={on}
              className={`card p-4 text-left transition ${on ? 'ring-2 ring-[color:var(--brand)]' : 'hover:border-[color:var(--ink-faint)]'}`}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-extrabold">{dataLabel(p.mb)}</span>
                <span className="font-extrabold">{ghs(p.sellingPrice)}</span>
              </div>
              <div className="mt-2 space-y-1 text-[12.5px] text-[color:var(--ink-mute)]">
                <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 shrink-0" />{p.onnetMins} min on MTN · {p.offnetMins} min to other networks</div>
                <div className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 shrink-0" />{p.sms} SMS</div>
                <div className="flex items-center gap-1.5"><Database className="w-3.5 h-3.5 shrink-0" />{dataLabel(p.mb)} data · {p.validityDays} days</div>
              </div>
            </button>
          );
        })}
      </div>

      <form onSubmit={buy} className="card p-5 mt-6 space-y-4">
        <Field label="MTN number" hint="The pack is loaded onto this number." value={phone} onChange={setPhone} placeholder="024 123 4567" inputMode="tel" autoComplete="tel" />
        <Field label="Email" hint="Your payment receipt goes here." value={email} onChange={setEmail} placeholder="you@example.com" type="email" autoComplete="email" />
        <div className="card-soft flex items-center justify-between p-3.5">
          <span className="text-[14px] text-[color:var(--ink-mute)]">Total</span>
          <span className="text-lg font-black">{chosen ? ghs(chosen.sellingPrice) : ghs(0)}</span>
        </div>
        <button type="submit" disabled={busy || !chosen} className="btn btn-yellow w-full justify-center">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Pay with MoMo or card'}
        </button>
        <p className="flex items-center justify-center gap-1.5 text-center text-[12px] text-[color:var(--ink-faint)]">
          <Clock className="w-3 h-3" /> Packs usually arrive within the hour, not instantly.
        </p>
      </form>

      <Link href={storeHref(storeSlug, '')} className="mt-6 inline-flex items-center gap-2 text-[14px] text-[color:var(--ink-mute)] hover:text-[color:var(--ink)]">
        <ArrowLeft className="w-4 h-4" /> Back to the store
      </Link>
    </div>
  );
}

function Field({ label, hint, value, onChange, ...rest }) {
  return (
    <label className="block">
      <span className="block text-[12px] font-bold text-[color:var(--ink-mute)] mb-1.5">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-[color:var(--border)] bg-transparent px-3 py-2.5 text-[15px] outline-none focus:border-[color:var(--brand)]"
        {...rest}
      />
      {hint && <span className="block text-[12px] text-[color:var(--ink-faint)] mt-1">{hint}</span>}
    </label>
  );
}
