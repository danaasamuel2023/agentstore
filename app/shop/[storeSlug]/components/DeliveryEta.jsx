'use client';

/**
 * DeliveryEta — fetches the public delivery-status endpoint and shows
 * the same "blazing fast / 1-2 hours / 4+ hours" banner the main DataMart
 * site uses (mtnup2u + /orders). Storefront-friendly: no auth, polls at
 * 30s, falls back silently on error.
 *
 * Exports:
 *   - useDeliveryEta()       — hook that returns { eta, lastDelivered, loading }
 *   - <DeliveryEtaBanner />  — full banner for above the product grid
 *   - <DeliveryEtaInline />  — compact one-liner for inside a confirm modal
 */

import { useEffect, useState } from 'react';
import { Truck, CheckCircle2 } from 'lucide-react';

const API_BASE = 'https://api.datamartgh.shop/api/v1';
const POLL_MS = 30_000;

function computeEta(lastDelivered) {
  if (!lastDelivered) return null;
  const placedTime = new Date(lastDelivered.placedAt).getTime();
  const deliveredTime = new Date(lastDelivered.deliveredAt).getTime();
  const deliveryMins = Math.round((deliveredTime - placedTime) / 60000);
  const sinceLast = Math.round((Date.now() - deliveredTime) / 60000);
  const diffMins = Math.max(deliveryMins, sinceLast);

  // Same buckets used on mtnup2u + /orders in the main DataMart site so
  // customers see consistent messaging wherever they look.
  if (diffMins <= 30) {
    return { msg: 'Deliveries are blazing fast! Your order should arrive within minutes.', color: 'text-green-600', emoji: '⚡', tone: 'green' };
  }
  if (diffMins <= 60) {
    return { msg: 'Deliveries are moving well. Expect your order within the hour.', color: 'text-green-600', emoji: '✅', tone: 'green' };
  }
  if (diffMins <= 120) {
    return { msg: 'Yello portal is processing orders steadily. Estimated: 1-2 hours.', color: 'text-yellow-600', emoji: '🕐', tone: 'yellow' };
  }
  if (diffMins <= 240) {
    return { msg: 'The Yello portal (MTN) is experiencing slight delays. Estimated: 2-4 hours. Your order is in the queue.', color: 'text-orange-600', emoji: '⏳', tone: 'orange' };
  }
  return { msg: 'There may be a validation issue on the Yello portal (MTN). Estimated: 4+ hours. Rest assured, all orders WILL be delivered.', color: 'text-red-600', emoji: '🔴', tone: 'red' };
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
        if (!stopped && json.status === 'success') {
          setData(json.data);
        }
      } catch {
        // silent — keep last known state
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
    loading
  };
}

const TONE_BG = {
  green: 'bg-green-50 border-green-200',
  yellow: 'bg-yellow-50 border-yellow-200',
  orange: 'bg-orange-50 border-orange-200',
  red: 'bg-red-50 border-red-200'
};

export function DeliveryEtaBanner() {
  const { eta, lastDelivered, scanner } = useDeliveryEta();
  if (!eta) return null;

  return (
    <section
      className={`rounded-2xl border ${TONE_BG[eta.tone] || 'bg-gray-50 border-gray-200'} px-4 py-3 sm:px-5 sm:py-4`}
      aria-live="polite"
    >
      <div className="flex items-center gap-2 mb-2">
        <Truck className="w-4 h-4 text-gray-700" />
        <span className="text-sm font-bold text-gray-900">Delivery Progress</span>
      </div>

      <div className="flex items-start gap-2 mb-2">
        <span className="text-lg leading-none mt-0.5">{eta.emoji}</span>
        <p className={`text-sm font-medium ${eta.color}`}>{eta.msg}</p>
      </div>

      {lastDelivered && (
        <div className="flex items-start gap-2 text-xs text-gray-600">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />
          <span>
            <span className="font-medium text-green-700">Last delivered: </span>
            #{lastDelivered.trackingId}
            {' — '}
            placed {new Date(lastDelivered.placedAt).toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Africa/Accra' })},
            {' '}delivered {new Date(lastDelivered.deliveredAt).toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'Africa/Accra' })}
          </span>
        </div>
      )}
    </section>
  );
}

export function DeliveryEtaInline() {
  const { eta } = useDeliveryEta();
  if (!eta) {
    return (
      <p className="text-xs text-gray-400 text-center">Usually 10 mins – 24 hours</p>
    );
  }
  return (
    <div className="flex items-start justify-center gap-2">
      <span>{eta.emoji}</span>
      <p className={`text-xs font-medium ${eta.color}`}>{eta.msg}</p>
    </div>
  );
}
