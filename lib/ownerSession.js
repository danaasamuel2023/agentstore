/**
 * Owner session — sign-in and store-settings calls for the design editor.
 *
 * The owner of an agent store is a DataMart user: `AgentStore.agentId` is a
 * User id, and the update route is guarded by `auth` + `verifyAgentOwnership`.
 * So signing in here is a normal DataMart login, and the JWT it returns is what
 * authorises the save.
 *
 * Calls go straight to the API rather than through /api/proxy. Login is
 * rate-limited per IP upstream (`app.use('/api/v1/login', loginRateLimit)`), and
 * routing it through our Vercel function would bucket every owner in the
 * country behind one egress IP.
 */

const API = 'https://api.datamartgh.shop/api/v1';
const TOKEN_KEY = 'cheapdata_owner_token';

/* -------------------------------------------------------------------------- */
/* Token                                                                      */
/* -------------------------------------------------------------------------- */

export const getToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* private mode — the session just won't survive a reload */
  }
};

export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* nothing to do */
  }
};

/* -------------------------------------------------------------------------- */
/* Transport                                                                  */
/* -------------------------------------------------------------------------- */

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = getToken();
    if (!token) throw new ApiError('You are signed out. Sign in again to continue.', 401);
    headers['x-auth-token'] = token;
  }

  let res;
  try {
    res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* some errors come back without a JSON body */
  }

  if (!res.ok) {
    // An expired or revoked token should drop the session rather than leave the
    // editor looping on 401s.
    if (res.status === 401 && auth) clearToken();
    throw new ApiError(
      data?.message || data?.details || `Request failed (${res.status}).`,
      res.status
    );
  }

  return data;
}

/* -------------------------------------------------------------------------- */
/* Sign-in                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Step one. Resolves to one of:
 *   { done: true, token }                       — signed in
 *   { done: false, step: 'otp',  loginToken, target, channels }
 *   { done: false, step: 'totp', loginToken }
 *
 * `enroll-totp` is only ever returned for admin / security roles, which a store
 * owner is not — if it somehow appears we send them to the main site rather
 * than trying to run an enrolment flow from a storefront.
 */
export async function login(email, password) {
  const data = await request('/login', {
    method: 'POST',
    body: { email: String(email || '').trim().toLowerCase(), password: String(password || '') },
  });

  if (data?.token) {
    setToken(data.token);
    return { done: true, token: data.token, user: data.user };
  }

  if (data?.step === 'otp') {
    return {
      done: false,
      step: 'otp',
      loginToken: data.loginToken,
      target: data.target,
      channels: data.channels || [],
    };
  }

  if (data?.step === 'totp') {
    return { done: false, step: 'totp', loginToken: data.loginToken };
  }

  throw new ApiError(
    'This account needs to finish signing in on the main DataMart site first.',
    400
  );
}

export async function verifyCode(step, loginToken, code) {
  const path = step === 'totp' ? '/login/verify-totp' : '/login/verify-otp';
  const data = await request(path, {
    method: 'POST',
    body: { loginToken, code: String(code || '').trim() },
  });

  if (!data?.token) throw new ApiError('That code was not accepted. Try again.', 400);
  setToken(data.token);
  return { done: true, token: data.token, user: data.user };
}

export async function resendOtp(loginToken) {
  return request('/login/resend-otp', { method: 'POST', body: { loginToken } });
}

/* -------------------------------------------------------------------------- */
/* Store                                                                      */
/* -------------------------------------------------------------------------- */

/** Public store document — the only place `customization` is readable from.
 *  (`/stores/mine` deliberately selects a narrow field list that omits it.) */
export async function fetchPublicStore(slug) {
  const data = await request(`/agent-stores/store/${encodeURIComponent(slug)}`);
  return data?.data || null;
}

/** The signed-in user's stores, used to resolve slug -> storeId and to prove
 *  this user actually owns the store they are looking at. */
export async function fetchMyStores() {
  const data = await request('/agent-stores/stores/mine', { auth: true });
  return data?.data?.stores || [];
}

/**
 * Save. Returns { store, dropped } where `dropped` lists any key the server did
 * not echo back.
 *
 * That check is not paranoia: `customization` is a nested path on the AgentStore
 * schema, so Mongoose strict mode silently discards keys it does not know. If
 * the API box has not been deployed with a field this editor sends, the request
 * still returns 200 and the owner would otherwise be told their change saved
 * when it did not.
 */
export async function saveStoreSettings(storeId, payload) {
  const data = await request(`/agent-stores/stores/${storeId}/update`, {
    method: 'PUT',
    body: payload,
    auth: true,
  });

  const store = data?.data || null;
  const dropped = [];

  if (store && payload.customization) {
    for (const [key, value] of Object.entries(payload.customization)) {
      const saved = store.customization?.[key];
      if (saved === undefined || (typeof value === 'string' && saved !== value)) {
        dropped.push(key);
      }
    }
  }

  return { store, dropped };
}

export { ApiError };
