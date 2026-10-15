/**
 * Reseller portal API client.
 *
 * Talks to DataMart's /api/subagent-portal/* endpoints — the same backend
 * the standalone subagent-portal at agent.cheapdata.shop hits, just from
 * inside databundle.shop. Token is stored under a separate localStorage
 * key (`databundle_reseller_token`) so it doesn't collide with the
 * customer auth (`fs_*`) or the owner auth (`owner_*`).
 *
 * Branding stays DataBundle — no DataMart, no Cheap Data strings leak
 * into UI copy through this client.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.datamartgh.shop/api/subagent-portal';

const TOKEN_KEY = 'databundle_reseller_token';
const USER_KEY = 'databundle_reseller_user';
const STORE_KEY = 'databundle_reseller_store';

export const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearSession = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(STORE_KEY);
};

export const saveSession = (user, store) => {
  if (typeof window === 'undefined') return;
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (store) localStorage.setItem(STORE_KEY, JSON.stringify(store));
};

export const getSavedUser = () => {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
};

export const getSavedStore = () => {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(STORE_KEY) || 'null'); } catch { return null; }
};

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401 && !endpoint.startsWith('/auth/login')) {
      clearSession();
      if (typeof window !== 'undefined') {
        window.location.href = '/reseller/login?expired=1';
      }
    }
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

export const resellerApi = {
  // Auth
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  me: () => request('/auth/me'),
  changePassword: (currentPassword, newPassword) => request('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword })
  }),
  updateProfile: (body) => request('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(body)
  }),

  // Dashboard / wallet
  dashboard: (period = 'today') => request(`/dashboard?period=${period}`),
  wallet: () => request('/wallet'),

  // Products
  products: () => request('/products'),
  updateProductPrice: (productId, sellingPrice) => request(`/products/${productId}/price`, {
    method: 'PUT',
    body: JSON.stringify({ sellingPrice })
  }),
  toggleProduct: (productId, isActive) => request(`/products/${productId}/toggle`, {
    method: 'PUT',
    body: JSON.stringify({ isActive })
  }),

  // Orders
  orders: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/orders${q ? `?${q}` : ''}`);
  },

  // Customers
  customers: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/customers${q ? `?${q}` : ''}`);
  },

  // Store settings
  updateStoreSettings: (body) => request('/store/settings', {
    method: 'PUT',
    body: JSON.stringify(body)
  }),
  toggleStore: () => request('/store/toggle', { method: 'POST' }),

  // Withdrawals
  withdrawalsList: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/list${q ? `?${q}` : ''}`);
  },
  createWithdrawal: (body) => request('/create', {
    method: 'POST',
    body: JSON.stringify(body)
  }),
  withdrawalDetails: (id) => request(`/details/${id}`),
  checkWithdrawalStatus: (id) => request(`/check-status/${id}`, { method: 'POST' })
};

export default resellerApi;
