'use client';

import { useEffect, useState } from 'react';
import { Gift, Loader2, PartyPopper } from 'lucide-react';

const API_BASE = 'https://api.datamartgh.shop/api';

/**
 * Spin & Win, on the payment success screen.
 *
 * It appears only when the backend says this order is owed a spin, so the
 * promotion can be switched off, budgeted out for the day, or already used
 * without this component knowing anything about the rules. Every decision —
 * eligible, won, lost, how many spins are left — belongs to the server. This
 * asks and renders.
 *
 * It renders NOTHING at all when there is no spin to offer, so a customer who
 * is not eligible sees the receipt exactly as before rather than a dead wheel
 * telling them they cannot play.
 */
export default function SpinWin({ reference, storeSlug }) {
  const [state, setState] = useState('checking');   // checking|ready|spinning|won|lost|claiming|done|hidden
  const [prize, setPrize] = useState(null);
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState(null);
  const [closed, setClosed] = useState(null);   // { opensAt, hoursLabel }

  useEffect(() => {
    if (!reference) return setState('hidden');
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/store-spin/eligibility?reference=${encodeURIComponent(reference)}`);
        const json = await res.json();
        if (!alive) return;
        const d = json?.data;
        if (!d) return setState('hidden');

        // A prize won earlier but never sent anywhere — they closed the tab,
        // lost signal, or came back later. The win is already theirs.
        if (d.awaitingPhone && d.result?.won) {
          setPrize(d.result);
          setPhone(d.result.suggestedPhone || '');
          return setState('won');
        }
        if (d.alreadySpun && d.result?.won && d.result.sentTo) {
          setPrize(d.result);
          setSentTo(d.result.sentTo);
          return setState('done');
        }
        if (d.eligible) return setState('ready');
        /**
         * Shut for the night, not ineligible. Someone buying at 2am would come
         * back at 8am if they knew there was a reason to, and the server has
         * already told us when that is — hiding it throws away free reach on a
         * screen they are already looking at.
         */
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
  }, [reference]);

  async function doSpin() {
    setState('spinning');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/store-spin/spin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference }),
      });
      const json = await res.json();
      const d = json?.data;
      // Let the wheel actually turn before the answer lands — the result is
      // already decided, this is just so it does not snap.
      await new Promise((r) => setTimeout(r, 2200));
      if (json.status !== 'success') { setError(json.message || 'Could not spin.'); return setState('ready'); }
      if (d?.won) {
        setPrize(d);
        setPhone(d.suggestedPhone || '');
        return setState('won');
      }
      setState('lost');
    } catch {
      setError('Could not spin. Please try again.');
      setState('ready');
    }
  }

  async function claim() {
    setError('');
    setState('claiming');
    try {
      const res = await fetch(`${API_BASE}/store-spin/claim`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference, phone }),
      });
      const json = await res.json();
      if (json.status !== 'success') {
        setError(json.message || 'Could not send it.');
        return setState('won');            // the prize is still theirs — let them retry
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
    <div className="mt-4 rounded-2xl border border-hairline p-4" style={{ background: 'var(--surface-2, transparent)' }}>
      {(state === 'ready' || state === 'spinning') && (
        <div className="text-center">
          <Wheel spinning={state === 'spinning'} />
          <p className="mt-3 text-[14px] font-semibold text-ink">You&rsquo;ve earned a spin</p>
          <p className="mt-1 text-[12.5px] text-ink-3">Thanks for your order. Try your luck &mdash; free data up for grabs.</p>
          <button
            type="button"
            onClick={doSpin}
            disabled={state === 'spinning'}
            className="btn btn-primary mt-3 w-full"
          >
            {state === 'spinning'
              ? (<><Loader2 className="h-4 w-4 animate-spin" /> Spinning&hellip;</>)
              : (<><Gift className="h-4 w-4" /> Spin now</>)}
          </button>
          {error && <p className="mt-2 text-[12.5px]" style={{ color: 'var(--warn)' }}>{error}</p>}
          {storeSlug && state === 'ready' && (
            <a href={`/shop/${storeSlug}/spin-win`} className="mt-2 inline-block text-[12px] text-ink-3 underline">
              How it works
            </a>
          )}
        </div>
      )}

      {state === 'closed' && (
        <div className="text-center">
          <Gift className="mx-auto h-6 w-6" style={{ color: 'var(--ink-3)' }} />
          <p className="mt-2 text-[13.5px] font-semibold text-ink">
            Spin &amp; Win opens at {closed?.opensAt || '8am'}
          </p>
          <p className="mt-1 text-[12.5px] text-ink-3">
            Buy again during {closed?.hoursLabel || '8am–9pm'} and you can spin for free data.
          </p>
          {storeSlug && (
            <a href={`/shop/${storeSlug}/spin-win`} className="mt-2 inline-block text-[12.5px] font-semibold underline">
              How it works
            </a>
          )}
        </div>
      )}

      {state === 'lost' && (
        <div className="text-center">
          <p className="text-[14px] font-semibold text-ink">Not this time</p>
          <p className="mt-1 text-[12.5px] text-ink-3">Better luck on your next order.</p>
        </div>
      )}

      {(state === 'won' || state === 'claiming') && (
        <div>
          <div className="text-center">
            <PartyPopper className="mx-auto h-7 w-7" style={{ color: 'var(--ok)' }} />
            <p className="mt-2 text-[15px] font-bold text-ink">You won {prize?.label}!</p>
            <p className="mt-1 text-[12.5px] text-ink-3">Which number should we send it to?</p>
          </div>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0XX XXX XXXX"
            className="input num mt-3 w-full text-center"
            maxLength={12}
          />
          <button
            type="button"
            onClick={claim}
            disabled={state === 'claiming' || phone.replace(/\D/g, '').length < 10}
            className="btn btn-primary mt-2 w-full"
          >
            {state === 'claiming'
              ? (<><Loader2 className="h-4 w-4 animate-spin" /> Sending&hellip;</>)
              : 'Send my data'}
          </button>
          {error && <p className="mt-2 text-center text-[12.5px]" style={{ color: 'var(--warn)' }}>{error}</p>}
        </div>
      )}

      {state === 'done' && (
        <div className="text-center">
          <PartyPopper className="mx-auto h-7 w-7" style={{ color: 'var(--ok)' }} />
          <p className="mt-2 text-[14px] font-semibold text-ink">
            {prize?.label} is on its way
          </p>
          <p className="mt-1 num text-[12.5px] text-ink-3">to {sentTo}</p>
        </div>
      )}
    </div>
  );
}

/** A wheel that looks like one prize slice per segment, and turns when asked. */
function Wheel({ spinning }) {
  const slices = 8;
  const colors = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#f97316', '#14b8a6', '#ec4899'];
  return (
    <div className="relative mx-auto h-24 w-24">
      <div
        className="h-24 w-24 rounded-full"
        style={{
          background: `conic-gradient(${colors
            .map((c, i) => `${c} ${(i * 360) / slices}deg ${((i + 1) * 360) / slices}deg`)
            .join(', ')})`,
          /* the result is already decided server-side; this is just motion */
          transition: spinning ? 'transform 2.2s cubic-bezier(.17,.67,.21,1)' : 'none',
          transform: spinning ? 'rotate(1440deg)' : 'rotate(0deg)',
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border border-hairline"
        style={{ background: 'var(--surface, #fff)' }}
      />
      <div
        className="absolute -top-1 left-1/2 h-0 w-0 -translate-x-1/2"
        style={{
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '10px solid var(--ink, #111)',
        }}
      />
    </div>
  );
}
