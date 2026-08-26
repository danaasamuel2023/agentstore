'use client';

/**
 * Result checkers.
 *
 * A WAEC or BECE card is a serial number and a PIN. Once it is shown it cannot
 * be replaced, so this page is built around one idea: the customer must not be
 * able to lose it. The card is written to the URL-addressable order, texted to
 * them, shown large, and copyable in one tap. The reference stays on screen
 * even on the failure paths, because it is the only thing they can hand to the
 * shop.
 *
 * Stock is shared across every shop on the platform, so a card is held the
 * moment checkout starts and released if payment never completes. That is why
 * the page says how long the hold lasts — an abandoned tab is not a purchase.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import {
  GraduationCap, Loader2, Copy, Check, AlertCircle, ShieldCheck,
  ArrowLeft, Clock,
} from 'lucide-react';

const API_BASE = 'https://api.datamartgh.shop/api/v1/agent-stores';

const STOCK_LABEL = {
  in_stock: null,
  low: 'Only a few left',
  out_of_stock: 'Sold out',
};

export default function CheckersPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.storeSlug;

  const [products, setProducts] = useState(null);   // null = loading
  const [enabled, setEnabled] = useState(true);
  const [maxQty, setMaxQty] = useState(5);

  const [picked, setPicked] = useState(null);
  const [qty, setQty] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);        // completed sale
  const [copied, setCopied] = useState(null);

  /* ---------------------------------------------------------- catalogue */
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const r = await fetch(`${API_BASE}/stores/${slug}/checkers`);
        const j = await r.json();
        if (dead) return;
        if (j.status === 'success') {
          setEnabled(!!j.data.enabled);
          setProducts(j.data.products || []);
          if (j.data.maxQuantity) setMaxQty(j.data.maxQuantity);
          const first = (j.data.products || []).find((p) => p.inStock);
          if (first) setPicked(first.checkerType);
        } else {
          setProducts([]);
        }
      } catch {
        if (!dead) { setProducts([]); setError('We could not load the checkers. Check your connection and try again.'); }
      }
    })();
    return () => { dead = true; };
  }, [slug]);

  /* --------------------------------------------- returning from Paystack */
  const confirm = useCallback(async (reference) => {
    setBusy(true);
    setError('');
    try {
      const r = await fetch(`${API_BASE}/stores/${slug}/checkers/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      });
      const j = await r.json();
      if (j.status === 'success') {
        setOrder(j.data);
      } else {
        // Every failure here still names the reference — it is what the shop
        // needs to find the payment.
        setError(`${j.message || 'We could not confirm that payment.'} Your reference is ${reference}.`);
        if (j.data) setOrder(j.data);
      }
    } catch {
      setError(`We could not reach the server. Your payment reference is ${reference} — keep it and try again.`);
    } finally {
      setBusy(false);
    }
  }, [slug]);

  useEffect(() => {
    const ref = searchParams.get('reference') || searchParams.get('trxref');
    if (ref) confirm(ref);
  }, [searchParams, confirm]);

  /* -------------------------------------------------------------- buy */
  const buy = async (e) => {
    e.preventDefault();
    setError('');

    if (!picked) return setError('Choose a checker first.');
    if (!name.trim()) return setError('Enter your name.');
    if (!/^(0\d{9}|233\d{9})$/.test(phone.replace(/\s/g, ''))) {
      return setError('Enter a valid Ghana phone number, e.g. 024 123 4567.');
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address.');

    setBusy(true);
    try {
      const r = await fetch(`${API_BASE}/stores/${slug}/checkers/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkerType: picked,
          quantity: qty,
          customerName: name.trim(),
          customerPhone: phone.replace(/\s/g, ''),
          customerEmail: email.trim().toLowerCase(),
          callbackUrl: `${window.location.origin}/shop/${slug}/checkers`,
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

  const copy = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1600);
  };

  const chosen = (products || []).find((p) => p.checkerType === picked);
  const total = chosen ? (chosen.price * qty) : 0;

  /* =================================================================== */
  /* the card — everything else on this page exists to get here          */
  /* =================================================================== */
  if (order?.status === 'completed') {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-10">
        <div className="mb-6 flex items-center gap-2 text-[13px] text-ok">
          <ShieldCheck className="h-4 w-4" />
          Paid — {order.quantity} {order.checkerType} checker{order.quantity > 1 ? 's' : ''}
        </div>

        <h1 className="text-2xl font-semibold tracking-tight text-ink">Your checker details</h1>
        <p className="mt-1 text-[14px] text-ink-3">
          We have also texted these to {order.customerPhone}. Write them down — a checker cannot be replaced once issued.
        </p>

        <div className="mt-6 space-y-3">
          {(order.cards || []).map((c, i) => (
            <div key={i} className="rounded-xl border border-hairline p-4">
              {order.cards.length > 1 && (
                <div className="eyebrow mb-3">Card {i + 1} of {order.cards.length}</div>
              )}
              <dl className="grid gap-3 sm:grid-cols-2">
                <Field label="Serial number" value={c.serialNumber}
                       copied={copied === `s${i}`} onCopy={() => copy(c.serialNumber, `s${i}`)} />
                <Field label="PIN" value={c.pin}
                       copied={copied === `p${i}`} onCopy={() => copy(c.pin, `p${i}`)} />
              </dl>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl border border-hairline p-4 text-[13px] text-ink-3">
          <div className="flex items-center justify-between">
            <span>Reference</span>
            <span className="num font-semibold text-ink">{order.reference}</span>
          </div>
        </div>

        <button onClick={() => router.push(`/shop/${slug}`)}
          className="mt-6 inline-flex items-center gap-2 text-[14px] text-ink-3 hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to the shop
        </button>
      </main>
    );
  }

  /* =================================================================== */
  if (products === null) {
    return (
      <main className="mx-auto flex w-full max-w-2xl items-center justify-center px-4 py-24 text-ink-3">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
      </main>
    );
  }

  if (!enabled || products.length === 0) {
    return (
      <main className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
        <GraduationCap className="mx-auto h-8 w-8 text-ink-4" />
        <h1 className="mt-4 text-xl font-semibold text-ink">No result checkers here yet</h1>
        <p className="mt-2 text-[14px] text-ink-3">This shop sells data bundles. Check back another time.</p>
        <button onClick={() => router.push(`/shop/${slug}/products`)} className="btn-brand mt-6">
          Browse bundles
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Result checkers</h1>
      <p className="mt-1 text-[14px] text-ink-3">
        Check your WAEC or BECE results. You get the serial number and PIN on screen and by SMS, straight away.
      </p>

      {busy && searchParams.get('reference') && (
        <div className="mt-6 flex items-center gap-2 rounded-xl border border-hairline p-4 text-[14px] text-ink-3">
          <Loader2 className="h-4 w-4 animate-spin" /> Confirming your payment…
        </div>
      )}

      {error && (
        <div className="mt-6 flex items-start gap-2 rounded-xl border border-hairline bg-[color-mix(in_srgb,var(--bad)_8%,transparent)] p-4 text-[14px] text-bad">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* pick */}
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {products.map((p) => {
          const on = picked === p.checkerType;
          const dead = !p.inStock;
          return (
            <button
              key={p.checkerType}
              type="button"
              disabled={dead}
              onClick={() => setPicked(p.checkerType)}
              className={`rounded-xl border p-4 text-left transition-colors ${
                dead ? 'border-hairline opacity-50'
                     : on ? 'border-[var(--brand)]' : 'border-hairline hover:border-ink-4'
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="font-semibold text-ink">{p.checkerType}</span>
                <span className="num font-semibold text-ink">GH₵{p.price.toFixed(2)}</span>
              </div>
              <div className="mt-1 text-[13px] text-ink-3">Result checker card</div>
              {STOCK_LABEL[p.stockLevel] && (
                <div className={`mt-2 text-[12px] ${dead ? 'text-ink-4' : 'text-warn'}`}>
                  {STOCK_LABEL[p.stockLevel]}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* buy */}
      <form onSubmit={buy} className="mt-8 space-y-4">
        <div>
          <label className="eyebrow mb-1.5 block">How many</label>
          <div className="flex gap-2">
            {Array.from({ length: maxQty }, (_, i) => i + 1).map((n) => (
              <button key={n} type="button" onClick={() => setQty(n)}
                className={`h-10 w-10 rounded-lg border text-[14px] font-semibold transition-colors ${
                  qty === n ? 'border-[var(--brand)] text-ink' : 'border-hairline text-ink-3 hover:text-ink'
                }`}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <Input label="Your name" value={name} onChange={setName} placeholder="Ama Mensah" autoComplete="name" />
        <Input label="Phone number" value={phone} onChange={setPhone} placeholder="024 123 4567"
               inputMode="tel" autoComplete="tel" hint="We text the serial and PIN here." />
        <Input label="Email" value={email} onChange={setEmail} placeholder="you@example.com"
               type="email" autoComplete="email" hint="Your Paystack receipt goes here." />

        <div className="flex items-center justify-between rounded-xl border border-hairline p-4">
          <span className="text-[14px] text-ink-3">Total</span>
          <span className="num text-lg font-semibold text-ink">GH₵{total.toFixed(2)}</span>
        </div>

        <button type="submit" disabled={busy || !chosen?.inStock} className="btn-brand w-full">
          {busy ? <Loader2 className="mx-auto h-4 w-4 animate-spin" /> : 'Pay now'}
        </button>

        {/* Stock is shared platform-wide, so the hold is real and finite. Saying
            so is fairer than letting a slow payment fail silently. */}
        <p className="flex items-center justify-center gap-1.5 text-center text-[12px] text-ink-4">
          <Clock className="h-3 w-3" />
          Your card is held for 20 minutes while you pay.
        </p>
      </form>
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

function Field({ label, value, copied, onCopy }) {
  return (
    <div>
      <dt className="eyebrow">{label}</dt>
      <dd className="mt-1 flex items-center gap-2">
        <span className="num select-all text-lg font-semibold tracking-wide text-ink">{value}</span>
        <button type="button" onClick={onCopy} aria-label={`Copy ${label}`}
          className="text-ink-4 transition-colors hover:text-ink">
          {copied ? <Check className="h-4 w-4 text-ok" /> : <Copy className="h-4 w-4" />}
        </button>
      </dd>
    </div>
  );
}
