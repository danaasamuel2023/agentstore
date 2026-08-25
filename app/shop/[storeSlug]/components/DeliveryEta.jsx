'use client';

/**
 * DeliveryEta — reads the public delivery-status endpoint and reports how fast
 * bundles are actually moving right now.
 *
 * Exports (unchanged, products/page.jsx depends on all three):
 *   - useDeliveryEta()       -> { eta, lastDelivered, scanner, loading }
 *   - <DeliveryEtaBanner />  -> full strip for above the price list
 *   - <DeliveryEtaInline />  -> one-liner for inside the confirm modal
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

  return {
    eta: computeEta(data?.lastDelivered),
    lastDelivered: data?.lastDelivered || null,
    scanner: data?.scanner || null,
    loading,
  };
}

export function DeliveryEtaBanner() {
  const { eta, lastDelivered } = useDeliveryEta();
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

      {/* The most persuasive thing on the page, so it is set like it.
          Whatever the status above says, this is a REAL order that really
          landed, with its id and its clock times — the difference between
          "they say it is slow" and "it is slow AND still moving". It gets its
          own rule, full ink, and bold figures; only the label stays quiet. */}
      {lastDelivered && (
        <div
          className="mt-2.5 border-t pt-2.5"
          style={{ borderColor: `color-mix(in srgb, var(--${eta.tone}) 22%, transparent)` }}
        >
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="text-[11px] uppercase tracking-[0.07em] text-ink-3">Last delivered</span>
            <span className="num text-[14px] font-bold text-ink">#{lastDelivered.trackingId}</span>
          </p>

          {/* Labelled, not an arrow. The two times only mean something as a
              PAIR — ordered at this, arrived at that — and an unlabelled
              `08:38 → 09:56` leaves the reader to work out which end is which. */}
          <dl className="mt-1.5 flex flex-wrap gap-x-6 gap-y-1.5">
            <div>
              <dt className="text-[10.5px] uppercase tracking-[0.07em] text-ink-3">Placed at</dt>
              <dd className="num whitespace-nowrap text-[13.5px] font-bold text-ink">{accraStamp(lastDelivered.placedAt)}</dd>
            </div>
            <div>
              <dt className="text-[10.5px] uppercase tracking-[0.07em] text-ink-3">Delivered at</dt>
              <dd className="num whitespace-nowrap text-[13.5px] font-bold text-ink">{accraStamp(lastDelivered.deliveredAt)}</dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  );
}

export function DeliveryEtaInline() {
  const { eta } = useDeliveryEta();

  if (!eta) {
    return <p className="text-center text-xs text-ink-4">Usually 10 minutes to 24 hours</p>;
  }

  return (
    <p className="flex items-center justify-center gap-2 text-center text-xs text-ink-3">
      <span className="pulse-dot" style={{ background: `var(--${eta.tone})` }} />
      <span>{eta.msg}</span>
    </p>
  );
}
