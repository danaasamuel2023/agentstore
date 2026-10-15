'use client';

/**
 * Spin & Win on the full store — after a paid order (MoMo/card checkout or
 * the customer's store wallet).
 *
 * Same backend as the simple store (cheapdata.shop): /api/store-spin, keyed by
 * the order's payment reference. Every decision — on or off, eligible, won or
 * lost, the daily caps, which prizes the store's wheel holds — is the
 * server's. This only asks and draws.
 *
 * It renders NOTHING when there is no spin to offer, so a customer who is not
 * eligible sees their receipt exactly as before, never a dead wheel.
 *
 * `orderPhone` is the number the order was for. The server asks for it as
 * proof the reference is yours; the receipt already knows it, so a customer
 * who just paid types nothing.
 */

import { useEffect, useState } from 'react';
import { Gift, Loader2, PartyPopper } from 'lucide-react';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'https://api.datamartgh.shop'}/api`;

export function SpinWin({ reference, orderPhone }) {
  const [state, setState] = useState('checking');   // checking|ready|spinning|won|claiming|lost|done|closed|hidden
  const [prize, setPrize] = useState(null);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState(null);
  const [closed, setClosed] = useState(null);
  const verify = String(orderPhone || '');

  useEffect(() => {
    if (!reference || !verify) { setState('hidden'); return undefined; }
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/store-spin/eligibility?reference=${encodeURIComponent(reference)}`);
        const d = (await res.json())?.data;
        if (!alive) return;
        if (!d) return setState('hidden');
        // Won earlier but never sent anywhere (closed the tab, lost signal):
        // the prize is already theirs.
        if (d.awaitingPhone && d.result?.won) {
          setPrize(d.result); setPhone(d.result.suggestedPhone || '');
          return setState('won');
        }
        if (d.alreadySpun && d.result?.won && d.result.sentTo) {
          setPrize(d.result); setSentTo(d.result.sentTo);
          return setState('done');
        }
        if (d.eligible) return setState('ready');
        if (d.reason === 'closed') {
          setClosed({ opensAt: d.opensAt, hoursLabel: d.hoursLabel });
          return setState('closed');
        }
        setState('hidden');
      } catch {
        if (alive) setState('hidden');
      }
    })();
    return () => { alive = false; };
  }, [reference, verify]);

  async function doSpin() {
    setState('spinning'); setError('');
    try {
      const res = await fetch(`${API_BASE}/store-spin/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, verifyPhone: verify }),
      });
      const json = await res.json();
      // The result is already decided; this just lets the wheel turn.
      await new Promise((r) => setTimeout(r, 2200));
      if (json.status !== 'success') { setError(json.message || 'Could not spin.'); return setState('ready'); }
      if (json.data?.won) {
        setPrize(json.data); setPhone(json.data.suggestedPhone || '');
        return setState('won');
      }
      setState('lost');
    } catch {
      setError('Could not spin. Please try again.');
      setState('ready');
    }
  }

  async function claim() {
    setError(''); setState('claiming');
    try {
      const res = await fetch(`${API_BASE}/store-spin/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, phone, verifyPhone: verify }),
      });
      const json = await res.json();
      if (json.status !== 'success') {
        setError(json.message || 'Could not send it.');
        return setState('won');            // still theirs — let them retry
      }
      setSentTo(json.data?.sentTo || phone);
      setState('done');
    } catch {
      setError('Could not send it. Please try again.');
      setState('won');
    }
  }

  if (state === 'checking' || state === 'hidden') return null;

  return (
    <div className="card-soft mt-5 p-5 text-center">
      {(state === 'ready' || state === 'spinning') && (
        <>
          <Wheel spinning={state === 'spinning'} />
          <p className="mt-3 text-[15px] font-extrabold text-[color:var(--ink)]">You&rsquo;ve earned a free spin</p>
          <p className="mt-1 text-[12.5px] text-[color:var(--ink-mute)]">Thanks for your order. Spin for a chance to win free data.</p>
          <button type="button" onClick={doSpin} disabled={state === 'spinning'} className="btn btn-yellow mt-4 w-full justify-center">
            {state === 'spinning'
              ? (<><Loader2 className="h-4 w-4 animate-spin" /> Spinning…</>)
              : (<><Gift className="h-4 w-4" /> Spin now</>)}
          </button>
          {error && <p className="mt-2 text-[12.5px] text-[color:var(--danger)]">{error}</p>}
        </>
      )}

      {state === 'closed' && (
        <>
          <Gift className="mx-auto h-6 w-6 text-[color:var(--ink-mute)]" />
          <p className="mt-2 text-[14px] font-bold text-[color:var(--ink)]">Spin &amp; Win opens at {closed?.opensAt || '8am'}</p>
          <p className="mt-1 text-[12.5px] text-[color:var(--ink-mute)]">
            Buy again between {closed?.hoursLabel || '8am and 9pm'} and you can spin for free data.
          </p>
        </>
      )}

      {state === 'lost' && (
        <>
          <p className="text-[15px] font-extrabold text-[color:var(--ink)]">Not this time</p>
          <p className="mt-1 text-[12.5px] text-[color:var(--ink-mute)]">Better luck on your next order.</p>
        </>
      )}

      {(state === 'won' || state === 'claiming') && (
        <>
          <PartyPopper className="mx-auto h-7 w-7 text-[color:var(--success)]" />
          <p className="mt-2 text-[16px] font-black text-[color:var(--ink)]">You won {prize?.label}!</p>
          <p className="mt-1 text-[12.5px] text-[color:var(--ink-mute)]">Which number should we send it to?</p>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Send the data to…"
            aria-label="Number to send the free data to"
            className="input mt-3 w-full text-center"
            maxLength={12}
          />
          <button
            type="button"
            onClick={claim}
            disabled={state === 'claiming' || phone.replace(/\D/g, '').length < 10}
            className="btn btn-yellow mt-2 w-full justify-center"
          >
            {state === 'claiming' ? (<><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>) : 'Send my data'}
          </button>
          {error && <p className="mt-2 text-[12.5px] text-[color:var(--danger)]">{error}</p>}
        </>
      )}

      {state === 'done' && (
        <>
          <PartyPopper className="mx-auto h-7 w-7 text-[color:var(--success)]" />
          <p className="mt-2 text-[15px] font-extrabold text-[color:var(--ink)]">{prize?.label} is on its way</p>
          <p className="mt-1 font-mono text-[12.5px] text-[color:var(--ink-mute)]">to {sentTo}</p>
        </>
      )}
    </div>
  );
}

/** Eight slices; turns while the server's answer is on its way. */
function Wheel({ spinning }) {
  const colors = ['var(--brand)', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#f97316', '#14b8a6', '#ec4899'];
  const n = colors.length;
  return (
    <div className="relative mx-auto h-24 w-24">
      <div
        className="h-24 w-24 rounded-full"
        style={{
          background: `conic-gradient(${colors.map((c, i) => `${c} ${(i * 360) / n}deg ${((i + 1) * 360) / n}deg`).join(', ')})`,
          transition: spinning ? 'transform 2.2s cubic-bezier(.17,.67,.21,1)' : 'none',
          transform: spinning ? 'rotate(1440deg)' : 'rotate(0deg)',
        }}
      />
      <div className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)]" />
      <div
        className="absolute -top-1 left-1/2 h-0 w-0 -translate-x-1/2"
        style={{ borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '10px solid var(--ink)' }}
      />
    </div>
  );
}
