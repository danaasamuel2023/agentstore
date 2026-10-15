'use client';

/**
 * DeliveryEta — the live delivery tracker, the same one main DataMart shows on
 * mtnup2u (DeliveryNotice) and the simple stores show above their price list.
 *
 * It reads the public delivery-status endpoint every 30 s and shows:
 *   - a one-line verdict taken from the lane that will serve the NEXT order
 *     (express → fast lane → standard queue), or the admin's own note;
 *   - one row per active lane with its last real order: track id, placed at,
 *     delivered (or sent) at, and how long it took.
 *
 * Lanes are never named after a vendor — customers see "Express", "Fast lane"
 * and "Standard queue". Which lane is "fast" is MEASURED each time (the faster
 * of the two), never assumed, and only claimed when there are two to compare.
 *
 * Exports:
 *   - useDeliveryEta()       — { eta, express, fast, standard, lastDelivered, scanner, loading }
 *   - <DeliveryEtaBanner />  — the tracker for above the bundle grid
 *   - <DeliveryEtaInline />  — the one-liner inside the buy modal
 */

import { useEffect, useState } from 'react';
import { Truck, Zap, Clock, Rocket } from 'lucide-react';

const API_BASE = 'https://api.datamartgh.shop/api/v1';
const POLL_MS = 30_000;

/* Date AND time on both stamps — a batch can cross midnight. */
const stamp = (v) => new Date(v).toLocaleString('en-GB', {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Africa/Accra',
});
const minutesBetween = (a, b) => (a && b)
  ? Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000))
  : null;
const waitText = (mins) => {
  if (mins == null || !Number.isFinite(mins)) return null;
  if (mins < 1) return 'under a minute';
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h${mins % 60 ? ` ${mins % 60}m` : ''}`;
};

/* The main site's buckets, so a customer who checks both is told one story.
   Takes the worse of "how long the last one took" and "how long since the last
   delivery" — a long quiet gap is the earlier warning. */
function verdictFor(lane) {
  if (!lane) return null;
  const since = Math.round((Date.now() - new Date(lane.deliveredAt).getTime()) / 60000);
  const m = Math.max(lane.mins ?? 0, since);
  if (m <= 10) return { tone: 'green', msg: 'MTN delivering fast — arriving within minutes.' };
  if (m <= 30) return { tone: 'green', msg: 'MTN moving well — within 10–30 min.' };
  if (m <= 60) return { tone: 'yellow', msg: 'MTN steady — within the hour.' };
  if (m <= 180) return { tone: 'orange', msg: 'MTN slight delays — 1–3 hours. Still delivering.' };
  return { tone: 'red', msg: 'MTN slow today (few hrs) — all orders queued & will deliver. Failures auto-refunded.' };
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
        // silent — keep the last known state
      } finally {
        if (!stopped) setLoading(false);
      }
    };
    fetchTracker();
    const interval = setInterval(fetchTracker, POLL_MS);
    return () => { stopped = true; clearInterval(interval); };
  }, []);

  // Express: its own row, only while it is actually delivering.
  const ef = data?.expressFrontier;
  const exMins = data?.expressActive && ef ? minutesBetween(ef.placedAt, ef.deliveredAt) : null;
  const express = exMins != null ? { ...ef, mins: exMins, wait: waitText(exMins) } : null;

  // The other two lanes: sort by real turnaround, faster one = "fast lane".
  const lanes = [
    data?.unibundleActive && data?.unibundleFrontier ? { ...data.unibundleFrontier, sentOnly: false } : null,
    // 'submitted' = handed to the network, not confirmed delivered.
    data?.lastDelivered ? { ...data.lastDelivered, sentOnly: data.lastDelivered.frontierSource === 'submitted' } : null,
  ]
    .filter((l) => l && l.placedAt && l.deliveredAt)
    .map((l) => ({ ...l, mins: minutesBetween(l.placedAt, l.deliveredAt) }))
    .filter((l) => l.mins != null)
    .sort((x, y) => x.mins - y.mins)
    .map((l) => ({ ...l, wait: waitText(l.mins) }));
  const fast = lanes.length >= 2 ? lanes[0] : null;
  const standard = lanes.length >= 2 ? lanes[lanes.length - 1] : (lanes[0] || null);

  let eta = null;
  if (data) {
    if (express) {
      eta = { tone: 'green', msg: express.mins <= 20 ? 'MTN express delivery active — new orders arriving within minutes.' : `MTN express delivery — new orders within about ${express.wait}.` };
    } else if (data.deliveryMode === 'fast') {
      eta = { tone: 'green', msg: 'MTN delivering fast — arriving within minutes.' };
    } else if (data.frontierMode || data.deliveryMode === 'slow') {
      const sent = data.lastDelivered?.frontierSource === 'submitted';
      const upTo = data.lastDelivered?.placedAt ? stamp(data.lastDelivered.placedAt) : null;
      eta = { tone: 'orange', msg: `MTN running slow — orders are queued and WILL be delivered${upTo ? `; ${sent ? 'sent to the network' : 'delivered'} up to orders placed ~${upTo}, yours is next` : ''}. Genuine failures auto-refunded.` };
    } else if (fast) {
      eta = fast.mins <= 20
        ? { tone: 'green', msg: 'MTN delivering fast right now — new orders arriving within minutes.' }
        : fast.mins <= 90
          ? { tone: 'green', msg: `MTN on the fast lane — new orders within about ${fast.wait}.` }
          : { tone: 'yellow', msg: `MTN on the fast lane — new orders within about ${fast.wait}. Some extra wait right now.` };
    } else {
      eta = verdictFor(standard);
    }
    if (data.deliveryNote) eta = { tone: eta?.tone || 'blue', msg: data.deliveryNote };
  }

  return { eta, express, fast, standard, lastDelivered: data?.lastDelivered || null, scanner: data?.scanner || null, loading };
}

const TONE_BG = {
  green: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/50',
  yellow: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800/50',
  orange: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800/50',
  red: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/50',
  blue: 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800/50',
};
const TONE_TEXT = {
  green: 'text-green-700 dark:text-green-300',
  yellow: 'text-yellow-700 dark:text-yellow-300',
  orange: 'text-orange-700 dark:text-orange-300',
  red: 'text-red-700 dark:text-red-300',
  blue: 'text-blue-700 dark:text-blue-300',
};
const LANE = {
  express: { label: 'Express', Icon: Rocket, row: 'bg-indigo-50/80 dark:bg-indigo-900/20', text: 'text-indigo-700 dark:text-indigo-300', chip: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-800/50 dark:text-indigo-200' },
  fast: { label: 'Fast lane', Icon: Zap, row: 'bg-emerald-50/80 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-800/50 dark:text-emerald-200' },
  standard: { label: 'Standard queue', Icon: Clock, row: 'bg-white/60 dark:bg-gray-800/30', text: 'text-blue-700 dark:text-blue-300', chip: 'bg-blue-100 text-blue-800 dark:bg-blue-800/50 dark:text-blue-200' },
};

/* One lane: its last real order — track id, placed, delivered, how long it took. */
function LaneRow({ kind, lane }) {
  if (!lane) return null;
  const s = LANE[kind];
  return (
    <div className={`px-3 py-2 ${s.row}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`flex items-center gap-1.5 text-[12px] font-bold ${s.text}`}>
          <s.Icon className="w-3.5 h-3.5" aria-hidden />
          {s.label}{lane.wait ? ` · ${lane.wait}` : ''}
        </span>
        <span className={`rounded px-1.5 text-[11px] font-bold tabular-nums ${s.chip}`}>#{lane.trackingId}</span>
      </div>
      <p className="mt-0.5 text-[11px] text-[color:var(--ink-mute)] tabular-nums">
        placed {stamp(lane.placedAt)} → {lane.sentOnly ? 'sent' : 'delivered'} {stamp(lane.deliveredAt)}
      </p>
    </div>
  );
}

export function DeliveryEtaBanner() {
  const { eta, express, fast, standard, scanner } = useDeliveryEta();
  if (!eta) return null;
  const hasLanes = express || fast || standard;

  return (
    <section
      className={`rounded-2xl border ${TONE_BG[eta.tone] || TONE_BG.blue} px-4 py-3 sm:px-5 sm:py-4`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2 mb-1.5">
        <Truck className="w-4 h-4 text-[color:var(--ink-mute)]" />
        <span className="text-sm font-bold text-[color:var(--ink)]">Delivery Progress</span>
      </div>
      <p className={`text-sm font-semibold ${TONE_TEXT[eta.tone] || TONE_TEXT.blue}`}>{eta.msg}</p>

      {hasLanes && (
        <div className="mt-2.5 overflow-hidden rounded-xl border border-[color:var(--border)] divide-y divide-[color:var(--border)]">
          <LaneRow kind="express" lane={express} />
          <LaneRow kind="fast" lane={fast} />
          <LaneRow kind="standard" lane={standard} />
        </div>
      )}

      {scanner?.isRunning && scanner.currentTrackingId && (
        <p className="mt-2 flex items-center gap-2 text-[11.5px] text-[color:var(--ink-mute)]">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
          Checking now · <span className="font-semibold tabular-nums">#{scanner.currentTrackingId}</span>
        </p>
      )}
    </section>
  );
}

export function DeliveryEtaInline() {
  const { eta, express, fast, standard } = useDeliveryEta();
  if (!eta) {
    return <p className="text-xs text-[color:var(--ink-faint)] text-center">Usually 10 mins – 24 hours</p>;
  }
  const lead = express || fast || standard;
  return (
    <div className="text-center">
      <p className={`text-xs font-semibold ${TONE_TEXT[eta.tone] || TONE_TEXT.blue}`}>{eta.msg}</p>
      {lead?.wait && (
        <p className="mt-0.5 text-[11px] text-[color:var(--ink-mute)]">
          Last order took {lead.wait} · #{lead.trackingId}
        </p>
      )}
    </div>
  );
}
