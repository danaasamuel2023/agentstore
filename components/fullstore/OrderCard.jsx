'use client';

/**
 * One order, everything on the card — modelled on main DataMart's order card.
 * Nothing to click to see the details: status, a paid · sent · delivered bar,
 * what the status means, when it was placed and delivered, the reference and
 * the network's track id (each with a copy button).
 */

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { NetworkIcon } from '@/components/fullstore/NetworkIcon';
import { formatGhs, NETWORK_LABEL } from '@/lib/fullstore/format';

/* Every status an order can have, in words a customer understands. */
const STATUS = {
  completed:      { label: 'Delivered',  tone: 'ok',   note: 'Data was delivered to the number.' },
  delivered:      { label: 'Delivered',  tone: 'ok',   note: 'Data was delivered to the number.' },
  accepted:       { label: 'Accepted',   tone: 'info', note: 'The network accepted it and is loading the data.' },
  processing:     { label: 'Processing', tone: 'info', note: 'Sent to the network. Most bundles land within minutes.' },
  queued:         { label: 'Queued',     tone: 'info', note: 'Waiting its turn to be sent. This is normal.' },
  pending:        { label: 'Pending',    tone: 'info', note: 'Placed and waiting to be sent.' },
  validating:     { label: 'Checking',   tone: 'info', note: 'Checking the number before sending.' },
  pending_retry:  { label: 'Retrying',   tone: 'warn', note: 'The first try did not go through. We are trying again.' },
  waiting:        { label: 'On hold',    tone: 'warn', note: 'New number: the network is checking it first. We keep trying — your money is safe.' },
  duplicate_hold: { label: 'On hold',    tone: 'warn', note: 'Held because it looks like a repeat of a recent order.' },
  failed:         { label: 'Failed',     tone: 'bad',  note: 'This order did not go through.' },
  refunded:       { label: 'Refunded',   tone: 'mute', note: 'The amount was returned to you.' },
  cancelled:      { label: 'Cancelled',  tone: 'mute', note: 'Cancelled and refunded.' },
};
const statusOf = (s) => STATUS[String(s || '').toLowerCase()] || { label: s || 'Unknown', tone: 'mute', note: '' };

const TONE = {
  ok:   'bg-[color:var(--success)]/12 text-[color:var(--success)]',
  info: 'bg-[#2563EB]/10 text-[#2563EB]',
  warn: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  bad:  'bg-[color:var(--danger)]/12 text-[color:var(--danger)]',
  mute: 'bg-[color:var(--surface-2)] text-[color:var(--ink-mute)]',
};

/** Where the order is: 0 placed · 1 sent · 3 delivered · -1 stopped. */
function stepOf(status) {
  const s = String(status || '').toLowerCase();
  if (['completed', 'delivered'].includes(s)) return 3;
  if (['accepted', 'processing', 'queued', 'pending_retry', 'waiting', 'duplicate_hold'].includes(s)) return 1;
  if (['failed', 'refunded', 'cancelled'].includes(s)) return -1;
  return 0;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function when(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(+d)) return null;
  const h = d.getHours(); const m = String(d.getMinutes()).padStart(2, '0');
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${((h + 11) % 12) + 1}:${m} ${h < 12 ? 'am' : 'pm'}`;
}
function took(from, to) {
  const ms = new Date(to) - new Date(from);
  if (!Number.isFinite(ms) || ms < 0) return null;
  const min = Math.round(ms / 60000);
  if (min < 1) return 'under a minute';
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  return `${h} hr ${min % 60} min`;
}

function CopyId({ label, value }) {
  const [done, setDone] = useState(false);
  if (!value) return null;
  const copy = async () => {
    try { await navigator.clipboard.writeText(String(value)); setDone(true); setTimeout(() => setDone(false), 1500); } catch {}
  };
  return (
    <div className="flex items-center justify-between gap-2 py-1">
      <span className="text-[12px] text-[color:var(--ink-mute)] shrink-0">{label}</span>
      <button type="button" onClick={copy} className="flex min-w-0 items-center gap-1.5 text-right" aria-label={`Copy ${label}`}>
        <span className="font-mono text-[12px] font-semibold text-[color:var(--ink)] truncate">{value}</span>
        {done ? <Check className="w-3.5 h-3.5 text-[color:var(--success)] shrink-0" /> : <Copy className="w-3.5 h-3.5 text-[color:var(--ink-faint)] shrink-0" />}
      </button>
    </div>
  );
}

export function OrderCard({ order }) {
  const st = statusOf(order.status);
  const step = stepOf(order.status);
  const stopped = step === -1;
  const deliveredAt = order.deliveredAt || (step === 3 ? order.completedAt : null);
  const bar = (n) => {
    if (stopped) return n === 0 ? 'bg-[color:var(--success)]' : 'bg-[color:var(--border-strong)]';
    if (n === 1 && st.tone === 'warn') return 'bg-amber-500';
    const lit = n === 0 || (n === 1 && step >= 1) || (n === 2 && step >= 3);
    return lit ? 'bg-[color:var(--success)]' : 'bg-[color:var(--border)]';
  };

  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <NetworkIcon network={order.network} size={40} />
        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-black">{order.capacity}GB <span className="text-[13px] font-bold text-[color:var(--ink-mute)]">{NETWORK_LABEL[order.network] || order.network}</span></div>
          <div className="font-mono text-[13px] text-[color:var(--ink-soft)]">{order.phoneNumber}</div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="text-[15px] font-extrabold tabular-nums">{formatGhs(order.price)}</div>
          <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${TONE[st.tone]}`}>{st.label}</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1" aria-hidden="true">
        {[0, 1, 2].map((n) => <span key={n} className={`h-1 rounded-full ${bar(n)}`} />)}
      </div>
      <div className="mt-1 grid grid-cols-3 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--ink-faint)]">
        <span>Paid</span><span className="text-center">Sent</span><span className="text-right">Delivered</span>
      </div>
      {st.note && <p className="mt-2 text-[12.5px] text-[color:var(--ink-mute)]">{st.note}</p>}

      <div className="mt-3 border-t border-[color:var(--border)] pt-2">
        <div className="flex items-center justify-between gap-2 py-1">
          <span className="text-[12px] text-[color:var(--ink-mute)]">Placed</span>
          <span className="text-[12px] font-semibold text-[color:var(--ink)]">{when(order.placedAt) || '—'}</span>
        </div>
        {deliveredAt && (
          <div className="flex items-center justify-between gap-2 py-1">
            <span className="text-[12px] text-[color:var(--ink-mute)]">Delivered</span>
            <span className="text-right text-[12px] font-semibold text-[color:var(--success)]">
              {when(deliveredAt)}{took(order.placedAt, deliveredAt) ? ` · took ${took(order.placedAt, deliveredAt)}` : ''}
            </span>
          </div>
        )}
        <CopyId label="Reference" value={order.reference} />
        <CopyId label="Track ID" value={order.trackId} />
      </div>
    </div>
  );
}
