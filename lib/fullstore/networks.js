/**
 * GENERATED FILE — do not edit here.
 * Source:    datamart-shared/src/networks.js
 * Generate:  node datamart-shared/sync.mjs --write   (check: node datamart-shared/sync.mjs)
 * Copy for:  full store (databundle.shop) — ES module, storefront variant
 */
/**
 * The three networks DataMart sells: their codes, names, and the number
 * prefixes the server accepts for each. Facts every app must agree on.
 *
 * Colours and logos are NOT here: each app draws networks its own way.
 *
 * The prefix lists match the server's validatePhoneNumber() (orderRou/order.js,
 * order_momo.js, bulkorder.js, ResellerApi/resellerApi.js — all four agree),
 * so an app refuses exactly the numbers the API would.
 */

export const NETWORKS = {
  YELLO: {
    code: 'YELLO',
    name: 'MTN',
    fullName: 'MTN Ghana',
    short: 'MTN',
    slug: 'mtn',
    // MTN's list is the broadest on purpose: it accepts ported numbers.
    prefixes: ['024', '054', '055', '059', '026', '025', '053', '027', '057', '023', '020', '050'],
  },
  TELECEL: {
    code: 'TELECEL',
    name: 'Telecel',
    fullName: 'Telecel Ghana',
    short: 'Telecel',
    slug: 'telecel',
    prefixes: ['020', '050'],
  },
  AT_PREMIUM: {
    code: 'AT_PREMIUM',
    name: 'AirtelTigo',
    fullName: 'AirtelTigo Ghana',
    short: 'AT',
    slug: 'airteltigo',
    prefixes: ['026', '056', '027', '057', '023', '053'],
  },
};

export const NETWORK_ORDER = ['YELLO', 'TELECEL', 'AT_PREMIUM'];

/** Other spellings found on older orders and in other systems. */
export const NETWORK_ALIASES = {
  at: 'AT_PREMIUM',
  airteltigo: 'AT_PREMIUM',
  AT: 'AT_PREMIUM',
  MTN: 'YELLO',
  mtn: 'YELLO',
  telecel: 'TELECEL',
  vodafone: 'TELECEL',
};

/** Any spelling → 'YELLO' | 'TELECEL' | 'AT_PREMIUM', or null. */
export function networkCode(code) {
  if (!code) return null;
  if (NETWORKS[code]) return code;
  return NETWORK_ALIASES[code] || NETWORK_ALIASES[String(code).toLowerCase()] || null;
}

/** The network's facts, or null. */
export function networkInfo(code) {
  const key = networkCode(code);
  return key ? NETWORKS[key] : null;
}

/** 'MTN' / 'Telecel' / 'AirtelTigo'; anything unknown is shown as given ('—' if empty). */
export function networkName(code) {
  return networkInfo(code)?.name || String(code || '—');
}

/** 'mtn' → the MTN entry, or null. */
export function networkBySlug(slug) {
  const key = NETWORK_ORDER.find((k) => NETWORKS[k].slug === slug);
  return key ? NETWORKS[key] : null;
}

/** Which networks a number's first three digits could belong to. */
export function guessNetworks(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length < 3) return [];
  const p = digits.slice(0, 3);
  return NETWORK_ORDER.filter((k) => NETWORKS[k].prefixes.includes(p));
}
