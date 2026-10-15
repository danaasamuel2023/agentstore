'use client';

import { NetworkIcon } from './NetworkIcon';
import { ChevronDown, AlertTriangle } from 'lucide-react';
import { formatGhs, NETWORK_LABEL } from '@/lib/fullstore/format';

// Network-themed surface: bundle cards adopt the full network colour
// (mirrors the DataMart consumer-buy screens at /mtnup2u, /TELECEL,
// /at-ishare-f so the storefront feels like the same product family).
// Text colour flips with the background — yellow/black for MTN, white
// for Telecel and AirtelTigo.
const NET_SURFACE = {
  YELLO:       { bg: '#FFCC00', ink: '#000', sub: 'rgba(0,0,0,0.6)' },
  MTN:         { bg: '#FFCC00', ink: '#000', sub: 'rgba(0,0,0,0.6)' },
  TELECEL:     { bg: '#E30613', ink: '#FFF', sub: 'rgba(255,255,255,0.75)' },
  AT_PREMIUM:  { bg: '#9333EA', ink: '#FFF', sub: 'rgba(255,255,255,0.8)' },
  at:          { bg: '#9333EA', ink: '#FFF', sub: 'rgba(255,255,255,0.8)' },
  airteltigo:  { bg: '#9333EA', ink: '#FFF', sub: 'rgba(255,255,255,0.8)' }
};

const DEFAULT_SURFACE = { bg: '#FBBF24', ink: '#000', sub: 'rgba(0,0,0,0.6)' };

export function BundleCard({ product }) {
  const networkLabel = NETWORK_LABEL[product.network] || product.network;
  const surface = NET_SURFACE[product.network] || DEFAULT_SURFACE;
  const unavailable = product.outOfStock || product.inStock === false;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl transition-all hover:shadow-xl hover:-translate-y-1 ${unavailable ? 'opacity-50 pointer-events-none' : ''}`}
      style={{ background: surface.bg, color: surface.ink }}
    >
      {unavailable && (
        <div className="bg-red-600 text-white text-[10px] font-bold py-0.5 text-center tracking-wide">
          OUT OF STOCK
        </div>
      )}

      <div className="p-5">
        {/* Top row: network logo + chevron affordance */}
        <div className="flex items-start justify-between mb-3">
          <NetworkIcon network={product.network} size={36} />
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center transition"
            style={{ background: surface.ink === '#000' ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.18)' }}
          >
            <ChevronDown className="w-4 h-4" />
          </span>
        </div>

        {/* GB amount — the headline */}
        <h3 className="text-3xl sm:text-4xl font-black leading-none">
          {product.capacity}GB
        </h3>
        <p className="text-sm mt-1" style={{ color: surface.sub }}>
          {networkLabel} Bundle
        </p>

        {/* Price + duration */}
        <div className="flex items-end justify-between mt-4">
          <span className="text-2xl font-black tabular-nums">
            {formatGhs(product.sellingPrice)}
          </span>
          <span className="text-xs font-semibold" style={{ color: surface.sub }}>
            1–5 min
          </span>
        </div>

        {unavailable && (
          <div className="mt-3 flex items-center gap-1.5 text-[11px]" style={{ color: surface.sub }}>
            <AlertTriangle className="w-3 h-3" />
            {product.outOfStockMessage || 'Currently unavailable'}
          </div>
        )}
      </div>
    </div>
  );
}
