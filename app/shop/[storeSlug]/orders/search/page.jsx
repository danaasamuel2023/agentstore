'use client';

/**
 * Track order.
 *
 * Someone opens this page because something has gone wrong, or they think it
 * has. That shapes every decision here: the answer comes first, it is stated in
 * plain words, and nothing on the page competes with it for attention.
 *
 * What went, and why:
 *  - Its own private MTN mark — a yellow circle with a zigzag — which matched
 *    nothing else on the site. It now uses the shared NetworkLogo, so a customer
 *    sees the same mark here that they tapped on the shop page.
 *  - Pastel status pills (bg-green-100 / bg-amber-50 / bg-blue-100). Four
 *    unrelated hues on one screen, none of them the shop's.
 *  - The hardcoded "10 minutes to 1 hour" amber box. That number was a guess
 *    printed as a fact. It is replaced by DeliveryEtaBanner, which reports what
 *    deliveries are ACTUALLY doing right now — the one thing a worried customer
 *    is really asking.
 *  - The bulleted "Tips:" list in the empty state, which read as filler. The
 *    same advice is now a short definition list.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Search, Package, CheckCircle2, Clock, XCircle, RotateCcw,
  Loader2, ArrowLeft, Copy, Check, ChevronDown, CalendarDays, X, UserPlus,
} from 'lucide-react';
import NetworkLogo from '../../components/NetworkLogo';
import { DeliveryEtaBanner } from '../../components/DeliveryEta';

const API_BASE = 'https://api.datamartgh.shop/api';

/* A phone number can have hundreds of orders behind it. Five is what fits on a
   phone screen without scrolling, and the one you are chasing is nearly always
   the newest. The rest stay one tap away. */
const PAGE_SIZE = 5;

/* What the tracker endpoint itself caps at. Kept here so the "there may be more"
   note below cannot drift away from the real limit. */
const API_MAX = 20;

/* Phone first — it is the default because it is the thing a customer actually
   has to hand. The reference and transaction id are on a receipt they may have
   closed. `field` is the key the tracker endpoint expects for each. */
const SEARCH_MODES = [
  { key: 'phone', label: 'Phone', field: 'phoneNumber', placeholder: '024 123 4567' },
  { key: 'reference', label: 'Reference', field: 'reference', placeholder: 'Order reference' },
  { key: 'transactionId', label: 'Transaction', field: 'transactionId', placeholder: 'Transaction ID' },
];

/* Every status the tracker can return, mapped onto ONE of three design tokens.
   `tone` names a CSS variable, so a status chip cannot drift away from the rest
   of the site's colours the way the old bg-*-100 classes did. */
const STATUS = {
  completed:  { label: 'Delivered',   tone: 'ok',    Icon: CheckCircle2 },
  delivered:  { label: 'Delivered',   tone: 'ok',    Icon: CheckCircle2 },
  refunded:   { label: 'Refunded',    tone: 'ok',    Icon: RotateCcw },
  pending:    { label: 'Pending',     tone: 'warn',  Icon: Clock },
  accepted:   { label: 'Accepted',    tone: 'warn',  Icon: Clock },
  processing: { label: 'Sending',     tone: 'warn',  Icon: Loader2, spin: true },
  on:         { label: 'Sending',     tone: 'warn',  Icon: Loader2, spin: true },
  failed:     { label: 'Failed',      tone: 'bad',   Icon: XCircle },

  /* `waiting` is NOT a queue position, which is what "In queue" said here and
     what the API's own status message said too.

     It is where an order lands when the network REJECTED the number — it is not
     a registered beneficiary yet. DataMart pairs `status: 'waiting'` with
     `notAllowedEver: true` throughout the cascade and JessCo queries, and stamps
     `sentForVerificationAt` when the number is exported for registration.

     Calling it "In queue" told people to sit and wait for something that was
     never going to arrive on its own. */
  waiting:    { label: 'Registering',  tone: 'warn',  Icon: UserPlus },
};

const statusOf = (status) => STATUS[status] || STATUS.pending;

/* The tracker sends `orderedAt` (the real createdAt) alongside the relative
   `timeSinceOrder`. "3 hours ago" is useless for telling two orders apart when
   someone bought four bundles in one afternoon, so the table shows the actual
   date and clock time and keeps the relative phrase as the secondary line. */
const orderedOn = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return {
    date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'Africa/Accra' }),
    time: d.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Africa/Accra',
    }),
  };
};

/* The tracker returns 'at' for AirtelTigo on some routes and 'AT_PREMIUM' on
   others. Normalise before the logo has to care. */
const normaliseNetwork = (network) => (network === 'at' ? 'AT_PREMIUM' : network);

function StatusChip({ status }) {
  const { label, tone, Icon, spin } = statusOf(status);
  return (
    <span
      className="chip flex-none"
      style={{ background: `var(--${tone}-soft)`, color: `var(--${tone})` }}
    >
      <Icon className={`h-3 w-3 ${spin ? 'animate-spin' : ''}`} />
      {label}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="flex-none text-[12.5px] text-ink-3">{label}</dt>
      <dd className="min-w-0 text-right text-[13px] text-ink">{children}</dd>
    </div>
  );
}

/**
 * The results table.
 *
 * A list of expanding cards forced someone to open each one to compare them,
 * which is the wrong shape for "which of my orders is the one that failed?".
 * Four columns answer that at a glance: what, to whom, when, and how it went.
 *
 * Below `sm` the number moves under the bundle instead of taking its own
 * column, so the table still fits a phone without sideways scrolling. A table
 * you have to drag sideways is worse than no table.
 */
function OrderTable({ orders, onOpen }) {
  return (
    <div className="overflow-hidden rounded-lg border border-hairline bg-paper">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-hairline">
            <th className="eyebrow px-4 py-2.5 font-semibold sm:px-5">Bundle</th>
            <th className="eyebrow hidden px-3 py-2.5 font-semibold sm:table-cell">Number</th>
            <th className="eyebrow px-3 py-2.5 font-semibold">Ordered</th>
            <th className="eyebrow px-4 py-2.5 text-right font-semibold sm:px-5">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr
              key={order.orderReference}
              onClick={() => onOpen(order)}
              tabIndex={0}
              role="button"
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onOpen(order);
                }
              }}
              className="cursor-pointer border-b border-hairline transition-colors last:border-0 hover:bg-sunken"
            >
              <td className="px-4 py-3 sm:px-5">
                <span className="flex items-center gap-2.5">
                  <NetworkLogo network={normaliseNetwork(order.product?.network)} size={28} />
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-semibold text-ink">
                      {order.product?.networkDisplay} {order.product?.capacityDisplay}
                    </span>
                    <span className="num block truncate text-[11.5px] text-ink-3 sm:hidden">
                      {order.recipientPhone}
                    </span>
                  </span>
                </span>
              </td>

              <td className="num hidden px-3 py-3 text-[13px] text-ink-2 sm:table-cell">
                {order.recipientPhone}
              </td>

              <td className="whitespace-nowrap px-3 py-3">
                {(() => {
                  const when = orderedOn(order.orderedAt);
                  if (!when) return <span className="text-[12.5px] text-ink-3">{order.timeSinceOrder}</span>;
                  return (
                    <>
                      <span className="num block text-[13px] font-medium text-ink">
                        {when.date}, {when.time}
                      </span>
                      <span className="block text-[11.5px] text-ink-3">{order.timeSinceOrder}</span>
                    </>
                  );
                })()}
              </td>

              <td className="px-4 py-3 text-right sm:px-5">
                <StatusChip status={order.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** One order in full — everything that does not belong in a comparison table.
 *  Rendered INSIDE the results popup, replacing the table, so there is never a
 *  dialog stacked on top of another dialog. */
function OrderDetail({ order, onCopy, copiedRef }) {
  if (!order) return null;

  const { tone } = statusOf(order.status);
  const reference = order.orderReference;
  const isDelivered = order.status === 'completed' || order.status === 'delivered';

  /* `tracking.portalSubmittedAt` is the stamp DataMart's own orders page shows
     as "Submitted to Yello server", and it is the time to surface here.
     portalCompletedAt and lastUpdated are fallbacks for orders with no portal
     record.

     Worth knowing: the DataMart client says in as many words that submitted to
     the portal is "handed to MTN, NOT delivered yet". So this reads as the
     delivery time only once the order has actually reached completed/delivered.
     While it is still moving, the same stamp is shown as "Sent to the network",
     which is what it truthfully is. Customers never see the word Yello —
     that is our upstream's name, not the network they bought from. */
  const portalStamp =
    order.tracking?.portalSubmittedAt || order.tracking?.portalCompletedAt || order.lastUpdated;
  const delivered = isDelivered ? orderedOn(portalStamp) : null;
  const sentToNetwork = !isDelivered ? orderedOn(order.tracking?.portalSubmittedAt) : null;
  const sentForVerification = orderedOn(order.sentForVerificationAt);
  const unresolved = ['pending', 'accepted', 'processing', 'on', 'failed'].includes(order.status);

  return (
    <div>
      <div className="flex items-start gap-3 border-b border-hairline p-5">
        <NetworkLogo network={normaliseNetwork(order.product?.network)} size={36} />
        <div className="min-w-0 flex-1">
          <h3 className="text-[15.5px]">
            {order.product?.networkDisplay} {order.product?.capacityDisplay}
          </h3>
          <p className="num mt-0.5 text-[12.5px] text-ink-3">{order.recipientPhone}</p>
        </div>
        <StatusChip status={order.status} />
      </div>

      <div>
        <div className="space-y-4 p-5">
          {order.statusMessage && (
            <p
              className="rounded-md px-3.5 py-3 text-[13px] leading-relaxed"
              style={{ background: `var(--${tone}-soft)`, color: `var(--${tone})` }}
            >
              {order.statusMessage}
            </p>
          )}

          <dl className="divide-y divide-hairline border-y border-hairline">
            <Field label="Reference">
              <span className="inline-flex items-center gap-1.5">
                <span className="num font-semibold">{reference}</span>
                <button
                  type="button"
                  onClick={() => onCopy(reference)}
                  className="rounded-sm p-1 text-ink-4 transition-colors hover:text-ink"
                  aria-label="Copy reference"
                >
                  {copiedRef === reference ? (
                    <Check className="h-3.5 w-3.5" style={{ color: 'var(--ok)' }} />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </span>
            </Field>
            {/* The portal id — what DataMart's own orders page labels "Track".
                It is the number support quotes back when chasing an order with
                the network, so a customer who has it can be helped faster than
                one who only has our internal reference. Only present once the
                order has actually reached a portal. */}
            {order.tracking?.portalId && (
              <Field label="Track ID">
                <span className="inline-flex items-center gap-1.5">
                  <span className="num font-semibold">{order.tracking.portalId}</span>
                  <button
                    type="button"
                    onClick={() => onCopy(String(order.tracking.portalId))}
                    className="rounded-sm p-1 text-ink-4 transition-colors hover:text-ink"
                    aria-label="Copy track ID"
                  >
                    {copiedRef === String(order.tracking.portalId) ? (
                      <Check className="h-3.5 w-3.5" style={{ color: 'var(--ok)' }} />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </span>
              </Field>
            )}

            <Field label="Ordered">
              {(() => {
                const when = orderedOn(order.orderedAt);
                return when ? (
                  <span className="num font-medium">
                    {when.date}, {when.time}
                  </span>
                ) : (
                  order.timeSinceOrder
                );
              })()}
            </Field>

            {/* When it actually landed. `tracking.portalCompletedAt` is the
                network's own completion stamp and is the truthful one; for
                orders with no portal record, `lastUpdated` is when the status
                was moved to delivered, which is the closest we hold. */}
            {delivered && (
              <Field label="Delivered">
                <span className="num font-semibold" style={{ color: 'var(--ok)' }}>
                  {delivered.date}, {delivered.time}
                </span>
              </Field>
            )}

            {/* Same stamp, honest label, for an order still in flight. */}
            {sentToNetwork && (
              <Field label="Sent to the network">
                <span className="num font-medium">
                  {sentToNetwork.date}, {sentToNetwork.time}
                </span>
              </Field>
            )}

            {/* Only set once the number has actually gone off for registration,
                so it doubles as proof that something is happening. */}
            {sentForVerification && (
              <Field label="Sent for registration">
                <span className="num font-medium">
                  {sentForVerification.date}, {sentForVerification.time}
                </span>
              </Field>
            )}
          </dl>

          {order.status === 'waiting' && (
            <div
              className="space-y-1.5 rounded-md px-3.5 py-3"
              style={{ background: 'var(--warn-soft)' }}
            >
              <p className="text-[13px] font-semibold" style={{ color: 'var(--warn)' }}>
                This number needs registering first
              </p>
              <p className="text-[12.5px] leading-relaxed text-ink-2">
                The network turned it down because it is not a registered beneficiary yet. It has
                been sent to be registered, and the bundle goes out as soon as that clears. Your
                money is not lost.
              </p>
              {order.canRequestRefund && (
                <p className="text-[12.5px] leading-relaxed text-ink-3">
                  If you would rather not wait, send the reference above to{' '}
                  {order.storeName || 'the shop'} and ask for a refund
                  {order.refundMomo ? ` to ${order.refundMomo}` : ''}.
                </p>
              )}
              {order.refundRequestedAt && (
                <p className="text-[12.5px] leading-relaxed text-ink-3">
                  A refund has already been requested for this one.
                </p>
              )}
            </div>
          )}

          {unresolved && (
            <p className="text-[12.5px] leading-relaxed text-ink-3">
              {order.status === 'failed'
                ? 'This one did not go through. Send the reference above to the shop and they can refund or resend it.'
                : 'Still in the queue. Nothing else is needed from you — keep the reference in case you want to ask about it.'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function OrderSearchPage() {
  const params = useParams();

  const [searchType, setSearchType] = useState('phone');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [searched, setSearched] = useState(false);
  const [detail, setDetail] = useState(null);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [copiedRef, setCopiedRef] = useState(null);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [showDates, setShowDates] = useState(false);
  const [showAll, setShowAll] = useState(false);

  /* Escape closes, and the page behind stops scrolling while the popup is up —
     a dialog that lets the page slide around under your thumb is a bug people
     feel rather than see. Escape steps back to the table first when a single
     order is open, so it unwinds the same way the back button does. */
  useEffect(() => {
    if (!resultsOpen) return undefined;
    const onKey = (e) => {
      if (e.key !== 'Escape') return;
      if (detail) setDetail(null);
      else setResultsOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [resultsOpen, detail]);

  const mode = SEARCH_MODES.find((m) => m.key === searchType) || SEARCH_MODES[0];
  const visibleOrders = showAll ? orders : orders.slice(0, PAGE_SIZE);

  const handleCopy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedRef(text);
      setTimeout(() => setCopiedRef(null), 2000);
    } catch {
      // Clipboard is blocked in some in-app browsers. The reference is on
      // screen either way, so failing quietly beats an error nobody can act on.
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    const value = searchValue.trim();
    if (!value) return;

    setLoading(true);
    setOrders([]);
    setSearched(true);
    setDetail(null);
    setResultsOpen(false);
    setError('');
    setShowAll(false);

    try {
      // The date window only applies to a phone search. A reference or a
      // transaction id identifies exactly one order, so narrowing it by date
      // can only ever hide the thing the customer just asked for by name.
      const payload = { [mode.field]: value };
      if (searchType === 'phone') {
        if (dateFrom) payload.dateFrom = dateFrom;
        if (dateTo) payload.dateTo = dateTo;
      }

      const res = await fetch(`${API_BASE}/momo-purchase/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.status === 'success' && data.data?.orders?.length) {
        setOrders(data.data.orders);
        setResultsOpen(true);
      }
    } catch {
      // The old version swallowed this and showed "No Orders Found", which
      // tells someone their order is missing when the truth is we could not ask.
      setError('We could not reach the tracker. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Above everything, including the heading: someone landing here is asking
          "is it just me, or is it slow today?" and this answers it before they
          have typed anything. */}
      <DeliveryEtaBanner />

      <div>
        <Link
          href={`/shop/${params.storeSlug}`}
          className="mb-5 inline-flex items-center gap-1.5 text-[13px] text-ink-3 transition-colors hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to the shop
        </Link>
        <h1 className="text-[26px]">Track your order</h1>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-3">
          Search by the number you bought for, or by the reference from your receipt.
        </p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="card space-y-4 p-5">
        {/* One control, not two. Three tabs above a field made the page look
            like it was asking two questions when it is asking one: what are you
            searching with, and what is it? A native <select> also hands phones
            their own picker instead of three small tap targets in a row.
            Phone is first, and the default, because it is what people have. */}
        <div className="space-y-2">
          <label htmlFor="track-value" className="eyebrow">
            Search by
          </label>

          <div
            className="flex items-stretch overflow-hidden rounded-sm border transition-colors focus-within:border-brand"
            style={{ borderColor: 'var(--hairline-strong)', background: 'var(--paper)' }}
          >
            <div className="relative flex-none">
              <select
                value={searchType}
                onChange={(e) => {
                  setSearchType(e.target.value);
                  // A reference typed into a phone search is never valid, and
                  // leaving it there invites one confusing "no orders" result.
                  setSearchValue('');
                }}
                aria-label="What to search by"
                className="h-11 cursor-pointer appearance-none bg-transparent py-0 pl-3 pr-8 text-[13.5px] font-medium text-ink outline-none"
              >
                {SEARCH_MODES.map(({ key, label }) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-4" />
            </div>

            <span aria-hidden className="w-px flex-none" style={{ background: 'var(--hairline-strong)' }} />

            <input
              id="track-value"
              type={searchType === 'phone' ? 'tel' : 'text'}
              inputMode={searchType === 'phone' ? 'numeric' : 'text'}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={mode.placeholder}
              className="num h-11 min-w-0 flex-1 bg-transparent px-3 text-[15px] text-ink outline-none placeholder:text-ink-4"
            />
          </div>
        </div>

        {/* Only for phone. See the note in handleSearch. */}
        {searchType === 'phone' && (
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => setShowDates((v) => !v)}
              className="flex items-center gap-1.5 text-[12.5px] font-medium text-ink-3 transition-colors hover:text-ink"
            >
              <CalendarDays className="h-3.5 w-3.5" />
              {showDates ? 'Hide dates' : 'Older order? Pick a date'}
              <ChevronDown className={`h-3 w-3 transition-transform ${showDates ? 'rotate-180' : ''}`} />
            </button>

            {showDates && (
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="eyebrow">From</span>
                  <input
                    type="date"
                    value={dateFrom}
                    max={dateTo || undefined}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="field num text-[13.5px]"
                  />
                </label>
                <label className="space-y-1">
                  <span className="eyebrow">To</span>
                  <input
                    type="date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="field num text-[13.5px]"
                  />
                </label>
              </div>
            )}
          </div>
        )}

        <button type="submit" disabled={loading || !searchValue.trim()} className="btn btn-brand btn-lg w-full">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {loading ? 'Searching' : 'Track order'}
        </button>
      </form>

      {error && (
        <p
          className="rounded-md px-4 py-3 text-[13px]"
          style={{ background: 'var(--bad-soft)', color: 'var(--bad)' }}
        >
          {error}
        </p>
      )}

      {loading && (
        <div className="divide-y divide-hairline overflow-hidden rounded-lg border border-hairline bg-paper">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5 sm:px-5">
              <div className="skeleton h-7 w-7 flex-none rounded-md" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3.5 w-32" />
                <div className="skeleton h-3 w-20" />
              </div>
              <div className="skeleton h-6 w-20 flex-none" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {/* The results themselves live in the popup. Once it is dismissed this
          line is what gets them back, so a search is never lost to a stray tap
          on the backdrop. */}
      {!loading && orders.length > 0 && !resultsOpen && (
        <button
          type="button"
          onClick={() => setResultsOpen(true)}
          className="card flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-sunken"
        >
          <span>
            <span className="block text-[14.5px] font-semibold text-ink">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'} found
            </span>
            <span className="block text-[12.5px] text-ink-3">Tap to see them again</span>
          </span>
          <span className="text-[13px] font-medium text-brand">View</span>
        </button>
      )}

      {/* Nothing found */}
      {!loading && searched && !error && orders.length === 0 && (
        <div className="card p-6">
          <div className="flex items-start gap-3">
            <Package className="mt-0.5 h-5 w-5 flex-none text-ink-4" />
            <div className="space-y-3">
              <div>
                <h2 className="text-[15px]">No orders under that {mode.label.toLowerCase()}</h2>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-3">
                  Nothing matched. One of these usually explains it.
                </p>
              </div>
              <dl className="divide-y divide-hairline border-t border-hairline">
                <div className="py-2.5">
                  <dt className="text-[13px] font-medium text-ink">The number you paid from</dt>
                  <dd className="text-[12.5px] leading-relaxed text-ink-3">
                    Orders are found by the number the data was sent TO, which is not always the
                    number that paid.
                  </dd>
                </div>
                <div className="py-2.5">
                  <dt className="text-[13px] font-medium text-ink">A very recent order</dt>
                  <dd className="text-[12.5px] leading-relaxed text-ink-3">
                    Give it a minute after paying, then search again.
                  </dd>
                </div>
                <div className="py-2.5">
                  <dt className="text-[13px] font-medium text-ink">Try the reference instead</dt>
                  <dd className="text-[12.5px] leading-relaxed text-ink-3">
                    It is on the receipt you were shown after paying.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      )}

      {/* There WAS a "what the statuses mean" legend here before any search.
          It is gone deliberately: it made someone read five explanations to
          find the one that applies, before they had even typed a number. Every
          status now explains itself in the order's own detail, next to the
          order it belongs to, which is the only place the explanation is
          actually needed. */}

      {/* Results popup.
          One dialog, two views: the table, and one order in full. Opening a row
          swaps the view rather than stacking a second dialog on top of the
          first — nested overlays are where a back button stops meaning
          anything on a phone. */}
      {resultsOpen && orders.length > 0 && (
        <div
          className="animate-fadeIn fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label={detail ? 'Order detail' : 'Your orders'}
        >
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setResultsOpen(false)}
          />

          <div
            className="animate-slideUp relative flex max-h-[88vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-lg bg-paper sm:max-h-[85vh] sm:rounded-lg"
            style={{ boxShadow: 'var(--lift-3)' }}
          >
            <div className="flex flex-none items-center gap-3 border-b border-hairline px-5 py-4">
              {detail ? (
                <button
                  type="button"
                  onClick={() => setDetail(null)}
                  className="flex items-center gap-1.5 text-[13px] font-medium text-ink-3 transition-colors hover:text-ink"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  All orders
                </button>
              ) : (
                <div className="min-w-0 flex-1">
                  <h2 className="text-[16px]">Your orders</h2>
                  <p className="num mt-0.5 text-[12.5px] text-ink-3">
                    {orders.length} found for {searchValue}
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setResultsOpen(false)}
                className="ml-auto flex-none rounded-sm p-1.5 text-ink-4 transition-colors hover:text-ink"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {detail ? (
                <OrderDetail order={detail} onCopy={handleCopy} copiedRef={copiedRef} />
              ) : (
                <div className="p-4 sm:p-5">
                  <OrderTable orders={visibleOrders} onOpen={setDetail} />

                  {orders.length > PAGE_SIZE && (
                    <button
                      type="button"
                      onClick={() => setShowAll((v) => !v)}
                      className="mt-3 text-[13px] font-medium text-brand transition-opacity hover:opacity-75"
                    >
                      {showAll ? `Show ${PAGE_SIZE} most recent` : `Show all ${orders.length}`}
                    </button>
                  )}

                  {/* The endpoint caps at 20 rows. Hitting exactly 20 almost
                      always means there are more we never saw, and saying
                      nothing lets someone conclude an older order is gone. */}
                  {orders.length >= API_MAX && (
                    <p className="mt-3 text-[12.5px] leading-relaxed text-ink-3">
                      Only the {API_MAX} most recent are searchable by number. For anything older,
                      close this and pick a date range, or search by the reference on your receipt.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
