'use client';

import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { storePortal } from '@/lib/fullstore/api';
import { NETWORK_LABEL, relativeTime } from '@/lib/fullstore/format';

/**
 * Trust-strip ticker — rotates through recent deliveries. Sourced from the
 * platform-wide /api/v1/data/live-status endpoint (no auth, cached 10s
 * server-side), so we can lean on it from any page.
 */
export function LiveTicker() {
  const [data, setData] = useState(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let stopped = false;
    const load = async () => {
      const json = await storePortal.liveStatus();
      if (!stopped && json?.status === 'success') setData(json.data);
    };
    load();
    const id = setInterval(load, 20000);
    return () => { stopped = true; clearInterval(id); };
  }, []);

  useEffect(() => {
    const len = data?.recentTicker?.length || 0;
    if (len < 2) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % len), 3500);
    return () => clearInterval(id);
  }, [data?.recentTicker?.length]);

  if (!data) return null;
  const item = data.recentTicker?.[idx];

  return (
    <div className="flex flex-wrap items-center gap-3 text-[12px]">
      <div className="flex items-center gap-1.5">
        <span className="relative inline-flex w-2 h-2">
          <span className="absolute inline-flex w-2 h-2 rounded-full bg-[color:var(--success)] dot-pulse"></span>
          <span className="relative inline-flex w-2 h-2 rounded-full bg-[color:var(--success)]"></span>
        </span>
        <span className="font-bold text-[color:var(--ink)]">Delivering now</span>
      </div>

      {typeof data.todayDelivered === 'number' && (
        <span className="text-[color:var(--ink-mute)]">
          <strong className="text-[color:var(--ink)] tabular-nums">{data.todayDelivered.toLocaleString()}</strong> bundles delivered today
        </span>
      )}

      {item && (
        <span className="flex items-center gap-1.5 text-[color:var(--ink-mute)] min-w-0">
          <Activity className="w-3 h-3 flex-shrink-0" />
          <span key={idx} className="fade-up truncate">
            <strong className="text-[color:var(--ink)]">{item.capacity}GB {NETWORK_LABEL[item.network] || item.network}</strong>
            {' '}→ {item.phoneMasked} · {item.secondsAgo}s ago
          </span>
        </span>
      )}
    </div>
  );
}
