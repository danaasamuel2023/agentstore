/** Locale-aware GHS formatter. Always 2dp, with the cedi sign. */
import { NETWORKS, NETWORK_ALIASES } from './networks';

export function formatGhs(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return 'GH₵ 0.00';
  return `GH₵ ${v.toFixed(2)}`;
}

/** Mask the middle digits of a Ghana mobile number: 024***1234. */
export function maskPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (digits.length < 7) return digits;
  return `${digits.slice(0, 3)}***${digits.slice(-4)}`;
}

/** "12s ago" / "5 min ago" / "2 hr ago" — no Date.toLocaleString overhead. */
export function relativeTime(input) {
  const date = input instanceof Date ? input : new Date(input);
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const m = Math.floor(diffSec / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return date.toLocaleDateString();
}

/** Friendly network label from internal codes — every spelling in
 *  lib/networks.js (generated from datamart-shared), e.g. NETWORK_LABEL.at. */
export const NETWORK_LABEL = Object.fromEntries([
  ...Object.keys(NETWORKS).map((k) => [k, NETWORKS[k].name]),
  ...Object.entries(NETWORK_ALIASES).map(([alias, k]) => [alias, NETWORKS[k].name]),
]);
