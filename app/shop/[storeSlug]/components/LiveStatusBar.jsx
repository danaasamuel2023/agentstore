'use client';
import { useEffect, useState, useRef } from 'react';
import { Zap, Package, Clock, Activity } from 'lucide-react';

const API_BASE = 'https://api.datamartgh.shop/api/v1';
const POLL_MS = 15_000;
const TICKER_ROTATE_MS = 3_000;

function timeAgo(secondsAgo) {
  if (secondsAgo < 60) return `${secondsAgo}s ago`;
  const m = Math.floor(secondsAgo / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export default function LiveStatusBar({ theme }) {
  const [data, setData] = useState(null);
  const [tickerIndex, setTickerIndex] = useState(0);
  const stoppedRef = useRef(false);

  // Poll the public live-status endpoint
  useEffect(() => {
    stoppedRef.current = false;
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${API_BASE}/data/live-status`, { cache: 'no-store' });
        const json = await res.json();
        if (!stoppedRef.current && json.status === 'success') {
          setData(json.data);
        }
      } catch {
        // silent — bar just keeps showing last good payload
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, POLL_MS);
    return () => {
      stoppedRef.current = true;
      clearInterval(interval);
    };
  }, []);

  // Rotate ticker entries
  useEffect(() => {
    if (!data?.recentTicker?.length) return;
    const id = setInterval(() => {
      setTickerIndex((i) => (i + 1) % data.recentTicker.length);
    }, TICKER_ROTATE_MS);
    return () => clearInterval(id);
  }, [data?.recentTicker?.length]);

  // Theme-driven colors with sensible fallback
  const primary = theme?.primary || '#1F2937';
  const secondary = theme?.secondary || '#111827';
  const textColor = theme?.text || '#FFFFFF';
  const subTextColor = theme?.text === '#000000' ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.75)';
  const chipBg = theme?.text === '#000000' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.12)';

  // Status copy — never show "stopped" / errored to customers
  const isFast = !data || data.avgMinutes <= 10;
  const isSlow = data && data.avgMinutes > 30 && data.avgMinutes <= 120;
  const isDelayed = data && data.avgMinutes > 120;

  let statusLabel = 'Delivering Now';
  if (isDelayed) statusLabel = 'Processing — slight delays';
  else if (isSlow) statusLabel = 'Processing Steadily';

  const dotColor = isDelayed ? '#F59E0B' : isSlow ? '#FBBF24' : '#34D399';

  const ticker = data?.recentTicker?.[tickerIndex];

  return (
    <section
      className="rounded-2xl shadow-md overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`,
        color: textColor,
      }}
      aria-live="polite"
    >
      {/* Top row: status + counters */}
      <div className="px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Left: live status */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="relative flex-shrink-0">
              <span
                className="absolute inline-flex h-2.5 w-2.5 rounded-full opacity-75 animate-ping"
                style={{ backgroundColor: dotColor }}
              />
              <span
                className="relative inline-flex h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: dotColor }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-bold truncate" style={{ color: textColor }}>
                  {statusLabel}
                </span>
                <span
                  className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-extrabold leading-none"
                  style={{ backgroundColor: dotColor, color: '#000' }}
                >
                  LIVE
                </span>
              </div>
              <div className="text-[10px] sm:text-[11px] mt-0.5" style={{ color: subTextColor }}>
                {data ? 'Real-time delivery activity' : 'Connecting...'}
              </div>
            </div>
          </div>

          {/* Right: counter chips */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{ backgroundColor: chipBg }}
            >
              <Zap className="w-3.5 h-3.5" style={{ color: textColor }} />
              <span className="text-[10px] sm:text-xs font-bold" style={{ color: textColor }}>
                {data?.todayDelivered ?? '—'}
              </span>
              <span className="text-[9px] sm:text-[10px] hidden sm:inline" style={{ color: subTextColor }}>
                today
              </span>
            </div>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{ backgroundColor: chipBg }}
            >
              <Package className="w-3.5 h-3.5" style={{ color: textColor }} />
              <span className="text-[10px] sm:text-xs font-bold" style={{ color: textColor }}>
                {data?.queueLength ?? '—'}
              </span>
              <span className="text-[9px] sm:text-[10px] hidden sm:inline" style={{ color: subTextColor }}>
                in queue
              </span>
            </div>
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
              style={{ backgroundColor: chipBg }}
            >
              <Clock className="w-3.5 h-3.5" style={{ color: textColor }} />
              <span className="text-[10px] sm:text-xs font-bold" style={{ color: textColor }}>
                {data?.avgMinutes != null ? `${data.avgMinutes}m` : '—'}
              </span>
              <span className="text-[9px] sm:text-[10px] hidden sm:inline" style={{ color: subTextColor }}>
                avg
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rolling ticker */}
      {ticker && (
        <div
          className="px-4 py-2 sm:px-5 border-t flex items-center gap-2"
          style={{ borderColor: chipBg, backgroundColor: chipBg }}
        >
          <Activity className="w-3.5 h-3.5 flex-shrink-0" style={{ color: textColor }} />
          <div className="flex-1 min-w-0">
            <p
              key={tickerIndex}
              className="text-[11px] sm:text-xs truncate transition-opacity duration-500"
              style={{ color: textColor }}
            >
              <span className="font-semibold">Just delivered:</span>{' '}
              <span style={{ color: textColor }}>
                {ticker.capacity}GB {ticker.network} → {ticker.phoneMasked}
              </span>{' '}
              <span style={{ color: subTextColor }}>· {timeAgo(ticker.secondsAgo)}</span>
            </p>
          </div>
        </div>
      )}

      {/* Per-network health (optional, hidden on smallest screens) */}
      {data?.networkHealth && Object.keys(data.networkHealth).length > 0 && (
        <div
          className="px-4 py-2 sm:px-5 border-t hidden md:flex items-center gap-3"
          style={{ borderColor: chipBg }}
        >
          {Object.entries(data.networkHealth).map(([name, h]) => {
            const dot =
              h.status === 'fast'
                ? '#34D399'
                : h.status === 'normal'
                ? '#60A5FA'
                : h.status === 'slow'
                ? '#FBBF24'
                : h.status === 'delayed'
                ? '#F87171'
                : '#9CA3AF';
            const label =
              h.status === 'fast'
                ? 'Fast'
                : h.status === 'normal'
                ? 'Normal'
                : h.status === 'slow'
                ? 'Slow'
                : h.status === 'delayed'
                ? 'Delayed'
                : '—';
            return (
              <div key={name} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dot }} />
                <span className="text-[10px] sm:text-[11px] font-semibold" style={{ color: textColor }}>
                  {name}
                </span>
                <span className="text-[10px] sm:text-[11px]" style={{ color: subTextColor }}>
                  {label}
                  {h.avgMinutes != null ? ` · ~${h.avgMinutes}m` : ''}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
