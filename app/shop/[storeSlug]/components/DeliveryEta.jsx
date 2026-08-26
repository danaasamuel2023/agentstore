'use client';

/**
 * DeliveryEta — reads the public delivery-status endpoint and reports how fast
 * bundles are actually moving right now.
 *
 * Exports (products/page.jsx depends on all three):
 *   - useDeliveryEta()       -> { eta, fast, standard, lastDelivered, scanner, loading }
 *   - <DeliveryEtaBanner />  -> full strip for above the price list
 *   - <DeliveryEtaInline />  -> one-liner for inside the confirm modal
 *
 * TWO LANES, like the main site's mtnup2u page. The endpoint reports two
 * frontiers and this used to read only one of them -- `lastDelivered`, which is
 * the STANDARD queue. On 2026-08-26 that queue's last order took 12h 15m while
 * the fast lane was turning orders around in 17 minutes, so every shopper here
 * was told "Slower than usual" about a lane that was not even serving them.
 *
 * So: the fast lane is shown whenever it is actually delivering, the standard
 * queue always, and THE VERDICT IS TAKEN FROM THE LANE THAT WILL SERVE THIS
 * ORDER. A headline that contradicts the rows under it is worse than no
 * headline -- the main site hit exactly that bug and its comment still warns
 * about it ("we used to show 'blazing fast' under a 'running slow' notice").
 *
 * Lanes are never named to customers. They see "fast lane" and "standard
 * queue"; which vendor is behind either is our business, not theirs.
 *
 * Two copy changes from the previous version:
 *
 *  1. The old strings named "the Yello portal" to customers. That is upstream
 *     plumbing, and naming it invites "so is it you or is it Yello?" tickets.
 *     Customers hear about MTN — the network they actually bought for — or
 *     about nothing.
 *  2. The emoji traffic-lights are gone. A row of 🔴⏳✅ is exactly the register
 *     we are trying to get away from; the tone now carries in a coloured dot and
 *     in plain wording.
 *  3. Every line is one clause. The old bad-weather message ran to two full
 *     sentences about validation queues, which is a paragraph nobody finishes
 *     when they are worried about a bundle. The status is the headline; the
 *     detail is four words after it.
 *
 * `eta.tone` is a design token name (ok / warn / bad) so callers can write
 * var(--ok) directly instead of mapping colour names to Tailwind classes.
 */

import { useEffect, useState } from 'react';
import { Zap, Clock } from 'lucide-react';

const API_BASE = 'https://api.datamartgh.shop/api/v1';
const POLL_MS = 30_000;

/* Date AND time on both stamps.
   
   A previous version dropped the date on the grounds that the two stamps are
   "nearly always the same day". That hid the single case that matters: placed
   09:07 am, delivered 10:40 pm reads as thirteen hours, but if it crossed
   midnight it was thirty-seven. The one time a reader needs the date is exactly
   the time the assumption fails, so both stamps carry it. */
const accraStamp = (value) =>
  new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Africa/Accra',
  });

/* "17 min", "2h 5m", "under a minute" — the single number a shopper wants. */
function waitText(fromISO, toISO) {
  const mins = Math.max(0, Math.round((new Date(toISO).getTime() - new Date(fromISO).getTime()) / 60000));
  if (!Number.isFinite(mins)) return null;
  if (mins < 1) return 'under a minute';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h${m ? ` ${m}m` : ''}`;
}

function computeEta(lastDelivered) {
  if (!lastDelivered) return null;

  const placedTime = new Date(lastDelivered.placedAt).getTime();
  const deliveredTime = new Date(lastDelivered.deliveredAt).getTime();
  if (!Number.isFinite(placedTime) || !Number.isFinite(deliveredTime)) return null;

  const deliveryMins = Math.round((deliveredTime - placedTime) / 60000);
  const sinceLast = Math.round((Date.now() - deliveredTime) / 60000);

  // Take the worse of "how long the last one took" and "how long since we last
  // delivered anything" — a long quiet gap is the earlier warning of the two.
  const diffMins = Math.max(deliveryMins, sinceLast);

  // Same buckets the main DataMart site uses on mtnup2u and /orders, so a
  // customer who checks both places is not told two different stories.
  if (diffMins <= 30) return { tone: 'ok', short: 'Delivering in minutes', msg: 'Bundles are landing fast.' };
  if (diffMins <= 60) return { tone: 'ok', short: 'Within the hour', msg: 'Deliveries are moving well.' };
  if (diffMins <= 120) return { tone: 'warn', short: 'About 1–2 hours', msg: 'MTN is a little slow.' };
  if (diffMins <= 240) return { tone: 'warn', short: 'About 2–4 hours', msg: 'MTN is slow right now.' };
  return { tone: 'bad', short: 'Slower than usual', msg: 'MTN is slow. Orders stay queued until delivered.' };
}

export function useDeliveryEta() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stopped = false;

    const fetchTracker = async () => {
      try {
        const res = await fetch(`${API_BASE}/data/delivery-status`, { cache: 'no-store' });
        const json = await res.json();
        if (!stopped && json.status === 'success') setData(json.data);
      } catch {
        // Silent: keep the last known state rather than flashing an error at a
        // shopper. A stale ETA is better than no page.
      } finally {
        if (!stopped) setLoading(false);
      }
    };

    fetchTracker();
    const interval = setInterval(fetchTracker, POLL_MS);
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, []);

  /* The fast lane counts only while it is ACTIVELY delivering. A lane that has
     been switched off still reports its last frontier, and quoting a 17-minute
     turnaround from a lane nothing is being sent to is a promise we cannot
     keep. */
  const fastLive = !!(data?.unibundleActive && data?.unibundleFrontier);
  const fast = fastLive
    ? { ...data.unibundleFrontier, wait: waitText(data.unibundleFrontier.placedAt, data.unibundleFrontier.deliveredAt) }
    : null;
  const standard = data?.lastDelivered
    ? {
        ...data.lastDelivered,
        wait: waitText(data.lastDelivered.placedAt, data.lastDelivered.deliveredAt),
        // 'submitted' means it reached the network, not that it landed. Saying
        // "delivered" for that is the false-completion bug in copy form.
        sentOnly: data.lastDelivered.frontierSource === 'submitted',
      }
    : null;

  return {
    // Verdict from whichever lane will actually serve the next order.
    eta: computeEta(fast || data?.lastDelivered),
    fast,
    standard,
    lastDelivered: data?.lastDelivered || null,
    scanner: data?.scanner || null,
    loading,
  };
}

/* One lane block: what it is, how long it took, and the real order that proves
   it. The times stay LABELLED — "placed 09:07 → delivered 10:40" leaves the
   reader to work out which end is which, and both carry the date because the
   one time it matters is the night a bundle crosses midnight. */
function LaneRow({ icon: Icon, label, wait, order, tone, sentOnly }) {
  if (!order) return null;
  return (
    <div className="px-3 py-2.5" style={tone ? { background: `var(--${tone}-soft)` } : undefined}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: tone ? `var(--${tone})` : 'var(--ink)' }}>
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {label}
          {wait && <span className="num">· {wait}</span>}
        </p>
        <span className="num text-[13px] font-bold text-ink">#{order.trackingId}</span>
      </div>
      <dl className="mt-1.5 flex flex-wrap gap-x-6 gap-y-1.5">
        <div>
          <dt className="text-[10.5px] uppercase tracking-[0.07em] text-ink-3">Placed at</dt>
          <dd className="num whitespace-nowrap text-[13px] font-bold text-ink">{accraStamp(order.placedAt)}</dd>
        </div>
        <div>
          <dt className="text-[10.5px] uppercase tracking-[0.07em] text-ink-3">{sentOnly ? 'Sent at' : 'Delivered at'}</dt>
          <dd className="num whitespace-nowrap text-[13px] font-bold text-ink">{accraStamp(order.deliveredAt)}</dd>
        </div>
      </dl>
    </div>
  );
}

export function DeliveryEtaBanner() {
  const { eta, fast, standard, scanner } = useDeliveryEta();
  if (!eta) return null;

  /* Tinted in the status tone rather than sitting on plain paper. On a page of
     white cards this is the one thing that should catch the eye first, and the
     colour says what the words say before anyone reads them. */
  return (
    <section
      className="rounded-lg border px-4 py-3 sm:px-5"
      aria-live="polite"
      style={{
        background: `var(--${eta.tone}-soft)`,
        borderColor: `color-mix(in srgb, var(--${eta.tone}) 34%, transparent)`,
      }}
    >
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13.5px]">
        <span className="pulse-dot" style={{ background: `var(--${eta.tone})` }} />
        <span className="font-semibold" style={{ color: `var(--${eta.tone})` }}>
          {eta.short}
        </span>
        <span className="text-ink-3">{eta.msg}</span>
      </p>

      {/* The most persuasive thing on the page, so it is set like it. Whatever
          the status above says, these are REAL orders that really landed, with
          their ids and their clock times — the difference between "they say it
          is slow" and "it is slow AND still moving". */}
      {(fast || standard) && (
        <div
          className="mt-2.5 divide-y overflow-hidden rounded-md border"
          style={{
            borderColor: `color-mix(in srgb, var(--${eta.tone}) 22%, transparent)`,
            borderTopColor: `color-mix(in srgb, var(--${eta.tone}) 22%, transparent)`,
          }}
        >
          <LaneRow icon={Zap} label="Fast lane" wait={fast?.wait} order={fast} tone="ok" />
          <LaneRow icon={Clock} label="Standard queue" wait={standard?.wait} order={standard} sentOnly={standard?.sentOnly} />
        </div>
      )}

      {scanner?.isRunning && scanner.currentTrackingId && (
        <p className="mt-2 flex items-center gap-2 text-[12px] text-ink-3">
          <span className="pulse-dot" style={{ background: 'var(--brand)' }} />
          <span>Checking now · <span className="num font-semibold text-ink-2">#{scanner.currentTrackingId}</span></span>
        </p>
      )}
    </section>
  );
}

export function DeliveryEtaInline() {
  const { eta, fast } = useDeliveryEta();

  if (!eta) {
    return <p className="text-center text-xs text-ink-4">Usually 10 minutes to 24 hours</p>;
  }

  return (
    <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs text-ink-3">
      <span className="pulse-dot" style={{ background: `var(--${eta.tone})` }} />
      <span>{eta.msg}</span>
      {/* In the confirm modal there is room for exactly one number, and the one
          that matters is the lane about to take THIS order. */}
      {fast?.wait && (
        <span className="num font-semibold" style={{ color: 'var(--ok)' }}>Fast lane · {fast.wait}</span>
      )}
    </p>
  );
}
