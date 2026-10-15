/**
 * Thin client around /api/store-portal/* on the DataMart backend.
 *
 * - Sends X-Store-Slug header on every call so the backend scopes the
 *   query to the right store. Same email/phone can register on multiple
 *   stores; the slug picks which one.
 * - Holds the access token in memory only. The refresh token lives in an
 *   httpOnly cookie set by the API, so it's invisible to JS.
 * - On a 401, transparently calls /auth/refresh and retries the original
 *   request once. Only one refresh attempt at a time — concurrent calls
 *   share the same in-flight promise.
 *
 * Public surface:
 *   apiRequest(path, { method, body, slug, skipAuth, skipRefresh })
 *   setAccessToken(token) / getAccessToken() / clearAccessToken()
 *   onUnauthorized(handler) — for the auth context to react to logout
 */

const API_BASE =
  (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_API_URL) ||
  'https://api.datamartgh.shop';

// ----- In-memory token (cleared on tab close — that's by design) ----------
let _accessToken = null;
// Owner token is held separately so customer and owner sessions can't
// step on each other (e.g. owner viewing their own store as a customer
// in another tab). Refresh cookie is a different name too.
let _ownerAccessToken = null;
const unauthorizedHandlers = new Set();
const ownerUnauthorizedHandlers = new Set();

export function setAccessToken(token) {
  _accessToken = token || null;
}
export function getAccessToken() {
  return _accessToken;
}
export function clearAccessToken() {
  _accessToken = null;
}
export function setOwnerAccessToken(token) {
  _ownerAccessToken = token || null;
}
export function getOwnerAccessToken() {
  return _ownerAccessToken;
}
export function clearOwnerAccessToken() {
  _ownerAccessToken = null;
}
export function onUnauthorized(handler) {
  unauthorizedHandlers.add(handler);
  return () => unauthorizedHandlers.delete(handler);
}
export function onOwnerUnauthorized(handler) {
  ownerUnauthorizedHandlers.add(handler);
  return () => ownerUnauthorizedHandlers.delete(handler);
}
function fireUnauthorized() {
  for (const h of unauthorizedHandlers) {
    try { h(); } catch (_) {}
  }
}
function fireOwnerUnauthorized() {
  for (const h of ownerUnauthorizedHandlers) {
    try { h(); } catch (_) {}
  }
}

// ----- Single-flight refresh ----------------------------------------------
let _refreshInFlight = null;
let _ownerRefreshInFlight = null;

async function refreshAccessToken(slug) {
  if (_refreshInFlight) return _refreshInFlight;
  _refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/store-portal/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Store-Slug': slug || ''
        }
      });
      if (!res.ok) return null;
      const data = await res.json().catch(() => null);
      const token = data?.data?.accessToken;
      if (token) setAccessToken(token);
      return token || null;
    } catch (_) {
      return null;
    } finally {
      _refreshInFlight = null;
    }
  })();
  return _refreshInFlight;
}

async function refreshOwnerAccessToken(slug) {
  if (_ownerRefreshInFlight) return _ownerRefreshInFlight;
  _ownerRefreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/store-portal/auth/owner-refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Store-Slug': slug || ''
        }
      });
      if (!res.ok) return null;
      const data = await res.json().catch(() => null);
      const token = data?.data?.accessToken;
      if (token) setOwnerAccessToken(token);
      return token || null;
    } catch (_) {
      return null;
    } finally {
      _ownerRefreshInFlight = null;
    }
  })();
  return _ownerRefreshInFlight;
}

// ----- Core request --------------------------------------------------------
export async function apiRequest(path, opts = {}) {
  const {
    method = 'GET',
    body,
    slug,
    skipAuth = false,
    skipRefresh = false,
    owner = false, // when true, uses owner token + owner refresh endpoint
    headers: extraHeaders
  } = opts;

  const headers = {
    'Content-Type': 'application/json',
    'X-Store-Slug': slug || '',
    ...(extraHeaders || {})
  };
  if (!skipAuth) {
    const tok = owner ? _ownerAccessToken : _accessToken;
    if (tok) headers['Authorization'] = `Bearer ${tok}`;
  }

  const init = {
    method,
    headers,
    credentials: 'include' // ensures the refresh cookie travels
  };
  if (body !== undefined && body !== null) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  let res = await fetch(`${API_BASE}${path}`, init);

  // On 401, try ONE refresh + retry. Skip if the caller said skipRefresh
  // (e.g. the refresh endpoint itself, or a login attempt).
  if (res.status === 401 && !skipRefresh && !skipAuth) {
    const newToken = owner
      ? await refreshOwnerAccessToken(slug)
      : await refreshAccessToken(slug);
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(`${API_BASE}${path}`, { ...init, headers });
    } else {
      if (owner) {
        clearOwnerAccessToken();
        fireOwnerUnauthorized();
      } else {
        clearAccessToken();
        fireUnauthorized();
      }
    }
  }

  // Parse JSON; tolerate non-JSON failures gracefully.
  let data = null;
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    data = await res.json().catch(() => null);
  } else {
    const text = await res.text().catch(() => '');
    data = text ? { raw: text } : null;
  }

  if (!res.ok) {
    const err = new Error(data?.message || data?.msg || `Request failed (${res.status})`);
    err.status = res.status;
    err.code = data?.code;
    err.data = data;
    throw err;
  }
  return data;
}

// ----- Endpoint helpers ---------------------------------------------------
export const storePortal = {
  // Public
  getStoreContext: (slug) =>
    apiRequest('/api/store-portal/store/context', { slug, skipAuth: true }),

  // Auth
  register: (slug, body) =>
    apiRequest('/api/store-portal/auth/register', { method: 'POST', slug, body, skipAuth: true, skipRefresh: true }),

  verifyOtp: (slug, body) =>
    apiRequest('/api/store-portal/auth/verify-otp', { method: 'POST', slug, body, skipAuth: true, skipRefresh: true }),

  resendOtp: (slug, body) =>
    apiRequest('/api/store-portal/auth/resend-otp', { method: 'POST', slug, body, skipAuth: true, skipRefresh: true }),

  login: (slug, body) =>
    apiRequest('/api/store-portal/auth/login', { method: 'POST', slug, body, skipAuth: true, skipRefresh: true }),

  logout: (slug) =>
    apiRequest('/api/store-portal/auth/logout', { method: 'POST', slug }),

  forgotPassword: (slug, body) =>
    apiRequest('/api/store-portal/auth/forgot-password', { method: 'POST', slug, body, skipAuth: true, skipRefresh: true }),

  resetPassword: (slug, body) =>
    apiRequest('/api/store-portal/auth/reset-password', { method: 'POST', slug, body, skipAuth: true, skipRefresh: true }),

  refresh: (slug) => refreshAccessToken(slug),

  // Customer
  me: (slug) => apiRequest('/api/store-portal/me', { slug }),

  updateProfile: (slug, body) =>
    apiRequest('/api/store-portal/me', { method: 'PATCH', slug, body }),

  changePassword: (slug, body) =>
    apiRequest('/api/store-portal/auth/change-password', { method: 'POST', slug, body }),

  // Wallet
  walletBalance: (slug) => apiRequest('/api/store-portal/wallet/balance', { slug }),

  walletTransactions: (slug, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/api/store-portal/wallet/transactions${q ? `?${q}` : ''}`, { slug });
  },

  // Orders
  orders: (slug, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/api/store-portal/orders${q ? `?${q}` : ''}`, { slug });
  },

  orderDetail: (slug, id) =>
    apiRequest(`/api/store-portal/orders/${id}`, { slug }),

  placeOrder: (slug, body) =>
    apiRequest('/api/store-portal/orders', { method: 'POST', slug, body }),

  // Deposits
  initiateDeposit: (slug, body, idempotencyKey) =>
    apiRequest('/api/store-portal/wallet/deposit/initiate', {
      method: 'POST',
      slug,
      body,
      headers: { 'Idempotency-Key': idempotencyKey }
    }),

  verifyDeposit: (slug, ref) =>
    apiRequest(`/api/store-portal/wallet/deposit/verify/${encodeURIComponent(ref)}`, {
      method: 'POST',
      slug
    }),

  // Live-status for the trust ticker (no auth, public)
  liveStatus: () =>
    fetch(`${API_BASE}/api/v1/data/live-status`, { cache: 'no-store' })
      .then((r) => r.json())
      .catch(() => null),

  // Public catalog (reuses existing agent-store endpoint)
  catalog: (slug) =>
    fetch(`${API_BASE}/api/v1/agent-stores/stores/${encodeURIComponent(slug)}/products`)
      .then((r) => r.json())
      .catch(() => null),

  // Guest checkout (no auth)
  initiateGuest: (slug, body, idempotencyKey) =>
    apiRequest('/api/store-portal/guest/initiate', {
      method: 'POST',
      slug,
      body,
      skipAuth: true,
      skipRefresh: true,
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}
    }),

  verifyGuest: (slug, ref) =>
    apiRequest(`/api/store-portal/guest/verify/${encodeURIComponent(ref)}`, {
      method: 'POST',
      slug,
      skipAuth: true,
      skipRefresh: true
    }),

  getGuestOrder: (slug, ref) =>
    apiRequest(`/api/store-portal/guest/order/${encodeURIComponent(ref)}`, {
      slug,
      skipAuth: true,
      skipRefresh: true
    }),

  // ----- Customer-as-Agent endpoints --------------------------------------
  // For when a logged-in customer has linked an AgentStore (via
  // /customer/become-agent). All routed under /customer/store/* on the
  // backend; auth is the customer's existing session.

  // Promote a customer to a primary agent. Pairs with /start-selling.
  becomeAgent: (slug, body) =>
    apiRequest('/api/store-portal/customer/become-agent', {
      method: 'POST', slug, body
    }),

  myStore: (slug) =>
    apiRequest('/api/store-portal/customer/store', { slug }),

  myStoreProducts: (slug) =>
    apiRequest('/api/store-portal/customer/store/products', { slug }),

  myStoreUpdateProduct: (slug, productId, body) =>
    apiRequest(`/api/store-portal/customer/store/products/${productId}`, {
      method: 'PATCH', slug, body
    }),

  myStoreOrders: (slug, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/api/store-portal/customer/store/orders${q ? `?${q}` : ''}`, { slug });
  },

  myStoreCustomers: (slug, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/api/store-portal/customer/store/customers${q ? `?${q}` : ''}`, { slug });
  },

  myStoreStats: (slug, period = 'today') =>
    apiRequest(`/api/store-portal/customer/store/stats?period=${period}`, { slug }),

  myStoreWithdrawals: (slug, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/api/store-portal/customer/store/withdrawals${q ? `?${q}` : ''}`, { slug });
  },

  myStoreWithdraw: (slug, body) =>
    apiRequest('/api/store-portal/customer/store/withdraw', {
      method: 'POST', slug, body
    })
};

// ----- Owner endpoints ----------------------------------------------------
// Used by the /{slug}/owner area. Every call passes { owner: true } so the
// owner-scoped token is used instead of the customer token.
export const ownerPortal = {
  // Step 1 — verify creds + ownership; backend emails a 6-digit code.
  // Returns { step: 'otp', loginToken, expiresIn, maskedEmail, store }.
  login: (slug, body) =>
    apiRequest('/api/store-portal/auth/owner-login', {
      method: 'POST',
      slug,
      body,
      skipAuth: true,
      skipRefresh: true
    }),

  // Step 2 — { loginToken, code } → { accessToken, owner, store }
  verifyOtp: (slug, body) =>
    apiRequest('/api/store-portal/auth/owner-verify-otp', {
      method: 'POST',
      slug,
      body,
      skipAuth: true,
      skipRefresh: true
    }),

  resendOtp: (slug, body) =>
    apiRequest('/api/store-portal/auth/owner-resend-otp', {
      method: 'POST',
      slug,
      body,
      skipAuth: true,
      skipRefresh: true
    }),

  // One-shot magic-link exchange. The token comes from the DataMart
  // agent dashboard; this hands back the normal owner accessToken and
  // sets the fs_owner_refresh cookie so the agent lands on /owner
  // already signed in.
  magic: (slug, body) =>
    apiRequest('/api/store-portal/auth/owner-magic', {
      method: 'POST',
      slug,
      body,
      skipAuth: true,
      skipRefresh: true
    }),

  // Discover variants — no slug needed; backend resolves the user's
  // fullstore from their User._id. Used when the URL slug doesn't match
  // the credentials, or when there's no slug context at all.
  discoverLogin: (body) =>
    apiRequest('/api/store-portal/auth/owner-discover-login', {
      method: 'POST',
      body,
      skipAuth: true,
      skipRefresh: true
    }),

  discoverVerifyOtp: (body) =>
    apiRequest('/api/store-portal/auth/owner-discover-verify-otp', {
      method: 'POST',
      body,
      skipAuth: true,
      skipRefresh: true
    }),

  discoverResendOtp: (body) =>
    apiRequest('/api/store-portal/auth/owner-discover-resend-otp', {
      method: 'POST',
      body,
      skipAuth: true,
      skipRefresh: true
    }),

  refresh: (slug) => refreshOwnerAccessToken(slug),

  logout: (slug) =>
    apiRequest('/api/store-portal/auth/owner-logout', {
      method: 'POST',
      slug,
      owner: true,
      skipRefresh: true
    }),

  me: (slug) =>
    apiRequest('/api/store-portal/owner/me', { slug, owner: true }),

  dashboard: (slug) =>
    apiRequest('/api/store-portal/owner/dashboard', { slug, owner: true }),

  transactions: (slug, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/api/store-portal/owner/transactions${q ? `?${q}` : ''}`, { slug, owner: true });
  },

  customers: (slug, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/api/store-portal/owner/customers${q ? `?${q}` : ''}`, { slug, owner: true });
  },

  deposits: (slug, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/api/store-portal/owner/deposits${q ? `?${q}` : ''}`, { slug, owner: true });
  },

  wallet: (slug) =>
    apiRequest('/api/store-portal/owner/wallet', { slug, owner: true }),

  products: (slug) =>
    apiRequest('/api/store-portal/owner/products', { slug, owner: true }),

  updateProduct: (slug, productId, body) =>
    apiRequest(`/api/store-portal/owner/products/${productId}`, {
      method: 'PATCH', slug, body, owner: true
    }),

  withdrawals: (slug, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/api/store-portal/owner/withdrawals${q ? `?${q}` : ''}`, { slug, owner: true });
  },

  walletWithdraw: (slug, body) =>
    apiRequest('/api/store-portal/owner/withdrawals/wallet', {
      method: 'POST', slug, body, owner: true
    }),

  // Native MoMo withdrawal — queues to the same background worker the main
  // dashboard uses. Keeps the owner inside databundle.shop (no deep-link out).
  momoWithdraw: (slug, body) =>
    apiRequest('/api/store-portal/owner/withdrawals/momo', {
      method: 'POST', slug, body, owner: true
    })
};
