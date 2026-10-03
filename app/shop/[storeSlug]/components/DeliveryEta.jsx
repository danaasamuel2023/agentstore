'use client';

/**
 * DeliveryEta — reads the public delivery-status endpoint and reports how fast
 * bundles are actually moving right now.
 *
 * Exports (products/page.jsx depends on all three):
 *   - useDeliveryEta()       -> { eta, fast, standard, lastDelivered, scanner, loading }
 *   - <DeliveryEtaBanner />  -> the full widget for above the price list. It has
 *                               four looks (strip / card / pill / banner); a
 *                               shared custom design picks one, every other
 *                               store keeps the strip.
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
import { Zap, Clock, Rocket, ChevronDown } from 'lucide-react';
import { useCustomDesign } from '@/lib/customDesignContext';

/** The looks DeliveryEtaBanner can take. `strip` is the original. */
export const ETA_STYLES = ['strip', 'card', 'pill', 'banner'];

/** Under this many minutes the lane serving the next order is "on fire". */
const HOT_MINS = 20;

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
  /* Express lane — the backend already picks the faster active provider and
     strips any brand/id-prefix, so we just render the neutral frontier it hands
     us. Shown as its own line (like the main site), only while it is active. */
  const expressLive = !!(data?.expressActive && data?.expressFrontier);
  const express = expressLive
    ? { ...data.expressFrontier, wait: waitText(data.expressFrontier.placedAt, data.expressFrontier.deliveredAt) }
    : null;

  /* MEASURE which lane is faster; never assume.
   *
   * This used to hard-code UniBundle as the "fast lane" and the eTopup frontier
   * as the "standard queue". On 2026-09-10 that put a 382-minute lane under
   * "Fast lane" and a 5-minute lane under "Standard queue" — the labels exactly
   * inverted, on the page people read before deciding to buy. Which vendor is
   * quickest changes with the cascade order and with the day; the main site's
   * banner has sorted by real turnaround since 2026-09-02, and this is the same
   * logic.
   *
   * The pair is also only labelled when there are TWO lanes to compare. Calling
   * a single active lane the "fast lane" claims a choice that does not exist. */
  const minutesBetween = (a, b) =>
    (a && b) ? Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000)) : null;

  const laneCandidates = [
    (data?.unibundleActive && data?.unibundleFrontier)
      ? { ...data.unibundleFrontier, sentOnly: false }
      : null,
    data?.lastDelivered
      ? {
          ...data.lastDelivered,
          // 'submitted' means it reached the network, not that it landed. Saying
          // "delivered" for that is the false-completion bug in copy form.
          sentOnly: data.lastDelivered.frontierSource === 'submitted',
        }
      : null,
  ]
    .filter((l) => l && l.placedAt && l.deliveredAt)
    .map((l) => ({ ...l, mins: minutesBetween(l.placedAt, l.deliveredAt) }))
    .filter((l) => l.mins != null)
    .sort((x, y) => x.mins - y.mins);

  const withWait = (l) => (l ? { ...l, wait: waitText(l.placedAt, l.deliveredAt) } : null);
  const fast = laneCandidates.length >= 2 ? withWait(laneCandidates[0]) : null;
  const standard = withWait(
    laneCandidates.length >= 2 ? laneCandidates[laneCandidates.length - 1] : (laneCandidates[0] || null)
  );

  // Verdict from whichever lane will actually serve the next order — express
  // first when it is live, else the fast lane, else the standard queue.
  const eta = express
    ? { tone: 'brand', short: 'Express delivery active', msg: express.wait ? `Recent express orders around ${express.wait}.` : 'Bundles landing in minutes.' }
    : computeEta(fast || standard || data?.lastDelivered);

  /* "On fire": the lane that takes the NEXT order turned its last one around in
     under 20 minutes. A standard-only queue also has to have delivered recently
     — a quick last order followed by a long silence is not fast delivery. */
  const leadLane = express || fast || standard;
  const leadMins = leadLane ? minutesBetween(leadLane.placedAt, leadLane.deliveredAt) : null;
  const sinceLast = !express && !fast && standard
    ? Math.round((Date.now() - new Date(standard.deliveredAt).getTime()) / 60000)
    : 0;
  const hot = !!eta && (eta.tone === 'ok' || eta.tone === 'brand')
    && leadMins != null && Math.max(leadMins, sinceLast) < HOT_MINS;

  return {
    eta,
    hot,
    lead: leadLane ? { wait: leadLane.wait, label: express ? 'Express' : fast ? 'Fast lane' : 'Standard queue' } : null,
    express,
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

function Fire() {
  return <span className="eta-fire" role="img" aria-label="on fire">🔥</span>;
}

/* The real orders behind the headline — shared by every look. */
function Lanes({ express, fast, standard, tone, className = '' }) {
  if (!express && !fast && !standard) return null;
  const edge = `color-mix(in srgb, var(--${tone}) 22%, transparent)`;
  return (
    <div className={`divide-y overflow-hidden rounded-md border ${className}`} style={{ borderColor: edge, borderTopColor: edge }}>
      <LaneRow icon={Rocket} label="Express" wait={express?.wait} order={express} tone="brand" />
      <LaneRow icon={Zap} label="Fast lane" wait={fast?.wait} order={fast} tone="ok" />
      <LaneRow icon={Clock} label="Standard queue" wait={standard?.wait} order={standard} sentOnly={standard?.sentOnly} />
    </div>
  );
}

function Checking({ scanner, className = '' }) {
  if (!scanner?.isRunning || !scanner.currentTrackingId) return null;
  return (
    <p className={`flex items-center gap-2 text-[12px] text-ink-3 ${className}`}>
      <span className="pulse-dot" style={{ background: 'var(--brand)' }} />
      <span>Checking now · <span className="num font-semibold text-ink-2">#{scanner.currentTrackingId}</span></span>
    </p>
  );
}

function DetailsToggle({ open, onClick, color }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={open}
      className="inline-flex flex-none items-center gap-1 text-[12.5px] font-semibold"
      style={{ color }}
    >
      {open ? 'Hide' : 'Details'}
      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
    </button>
  );
}

/**
 * @param variant  one of ETA_STYLES. Omitted → the shared custom design's choice
 *                 (theme.etaStyle), else the original strip.
 */
export function DeliveryEtaBanner({ variant }) {
  const d = useDeliveryEta();
  const { custom } = useCustomDesign();
  const [open, setOpen] = useState(false);
  const { eta, hot, lead, express, fast, standard, scanner } = d;
  if (!eta) return null;

  const wanted = variant || custom?.theme?.etaStyle;
  const look = ETA_STYLES.includes(wanted) ? wanted : 'strip';
  const tone = `var(--${eta.tone})`;
  const hasLanes = !!(express || fast || standard);

  /* card — the wait time as the one big number, the proof one tap away. */
  if (look === 'card') {
    return (
      <section
        className="rounded-xl border p-4 sm:p-5"
        aria-live="polite"
        style={{ background: 'var(--paper)', borderColor: 'color-mix(in srgb, var(--ink) 12%, transparent)', boxShadow: 'var(--lift-2)' }}
      >
        <div className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-3">
              <span className="pulse-dot" style={{ background: tone }} />
              Delivery right now
            </p>
            <p className="num mt-1.5 text-[30px] font-bold leading-none tracking-[-0.03em] text-ink">
              {lead?.wait ? `~${lead.wait}` : eta.short} {hot && <Fire />}
            </p>
            <p className="mt-2 text-[13px]">
              <span className="font-semibold" style={{ color: tone }}>{eta.short}.</span>{' '}
              <span className="text-ink-3">{eta.msg}</span>
            </p>
          </div>
          {hasLanes && <DetailsToggle open={open} onClick={() => setOpen((v) => !v)} color={tone} />}
        </div>
        {open && <Lanes express={express} fast={fast} standard={standard} tone={eta.tone} className="mt-3.5" />}
        {open && <Checking scanner={scanner} className="mt-2" />}
      </section>
    );
  }

  /* pill — one small rounded badge; tap it for the real orders. */
  if (look === 'pill') {
    return (
      <section aria-live="polite">
        <button
          type="button"
          onClick={() => hasLanes && setOpen((v) => !v)}
          aria-expanded={open}
          className="inline-flex max-w-full items-center gap-2 rounded-full border py-2 pl-3.5 pr-3 text-[13px]"
          style={{ background: `var(--${eta.tone}-soft)`, borderColor: `color-mix(in srgb, ${tone} 34%, transparent)` }}
        >
          <span className="pulse-dot" style={{ background: tone }} />
          <span className="truncate font-semibold" style={{ color: tone }}>{eta.short}</span>
          {lead?.wait && <span className="num flex-none font-bold text-ink">~{lead.wait}</span>}
          {hot && <Fire />}
          {hasLanes && <ChevronDown className={`h-3.5 w-3.5 flex-none text-ink-3 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />}
        </button>
        {open && <Lanes express={express} fast={fast} standard={standard} tone={eta.tone} className="mt-2.5" />}
        {open && <Checking scanner={scanner} className="mt-2" />}
      </section>
    );
  }

  /* banner — a bar in the shop's own colour. The status dot keeps its tone so a
     slow day still reads as slow on a brand-coloured bar. */
  if (look === 'banner') {
    return (
      <section className="overflow-hidden rounded-lg" aria-live="polite" style={{ border: '1px solid color-mix(in srgb, var(--brand) 30%, transparent)' }}>
        <div className="flex items-center gap-3 px-4 py-3 sm:px-5" style={{ background: 'var(--brand)', color: 'var(--brand-ink)' }}>
          <span className="pulse-dot" style={{ background: eta.tone === 'brand' ? 'var(--brand-ink)' : tone, boxShadow: '0 0 0 2px var(--brand-ink)' }} />
          <p className="min-w-0 flex-1 text-[14px]">
            <span className="font-bold">{eta.short}</span>
            {lead?.wait && <span className="num font-bold"> · ~{lead.wait}</span>} {hot && <Fire />}
            <span className="ml-1.5 hidden opacity-80 sm:inline">{eta.msg}</span>
          </p>
          {hasLanes && <DetailsToggle open={open} onClick={() => setOpen((v) => !v)} color="var(--brand-ink)" />}
        </div>
        {open && (
          <div className="p-3" style={{ background: 'var(--paper)' }}>
            <Lanes express={express} fast={fast} standard={standard} tone={eta.tone} />
            <Checking scanner={scanner} className="mt-2" />
          </div>
        )}
      </section>
    );
  }

  /* strip (the original). Tinted in the status tone rather than sitting on plain
     paper. On a page of white cards this is the one thing that should catch the
     eye first, and the colour says what the words say before anyone reads them. */
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
        <span className="pulse-dot" style={{ background: tone }} />
        <span className="font-semibold" style={{ color: tone }}>
          {eta.short}
        </span>
        {hot && <Fire />}
        <span className="text-ink-3">{eta.msg}</span>
      </p>

      {/* The most persuasive thing on the page, so it is set like it. Whatever
          the status above says, these are REAL orders that really landed, with
          their ids and their clock times — the difference between "they say it
          is slow" and "it is slow AND still moving". */}
      <Lanes express={express} fast={fast} standard={standard} tone={eta.tone} className="mt-2.5" />
      <Checking scanner={scanner} className="mt-2" />
    </section>
  );
}

export function DeliveryEtaInline() {
  const { eta, hot, express, fast } = useDeliveryEta();

  if (!eta) {
    return <p className="text-center text-xs text-ink-4">Usually 10 minutes to 24 hours</p>;
  }

  // In the confirm modal there is room for exactly one number — the lane about
  // to take THIS order. Express wins when it is live, else the fast lane.
  const lead = express?.wait
    ? { label: 'Express', wait: express.wait, tone: 'brand' }
    : fast?.wait
      ? { label: 'Fast lane', wait: fast.wait, tone: 'ok' }
      : null;

  return (
    <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs text-ink-3">
      <span className="pulse-dot" style={{ background: `var(--${eta.tone})` }} />
      <span>{eta.msg}</span>
      {lead && (
        <span className="num font-semibold" style={{ color: `var(--${lead.tone})` }}>{lead.label} · {lead.wait}</span>
      )}
      {hot && <Fire />}
    </p>
  );
}
