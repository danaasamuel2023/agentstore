/**
 * Customer auth context.
 *
 * Tracks the currently logged-in customer for whichever store this tab is
 * scoped to. Each store gets its own auth boundary via X-Store-Slug, so the
 * customer object always represents "me on Store X".
 *
 * On mount we attempt a silent refresh — if the httpOnly cookie is alive,
 * we get a fresh access token and load the profile. Otherwise the user is
 * shown the logged-out UI.
 */

'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { storePortal, setAccessToken, clearAccessToken, onUnauthorized } from './api';
import { getPlatformSlug } from './links';

const AuthContext = createContext({
  status: 'idle',       // 'idle' | 'loading' | 'authed' | 'guest'
  customer: null,
  wallet: null,
  storeSlug: null,
  refresh: async () => {},
  login: async () => {},
  logout: async () => {},
  setCustomerData: () => {}
});

export function AuthProvider({ children }) {
  const params = useParams();
  // /[storeSlug]/... → params.storeSlug. Root-level pages
  // (/start-selling, /reseller, /account) have no slug param — fall back
  // to the platform slug so useAuth still tries the customer's session
  // and the page doesn't flip to 'guest' just because there's no slug
  // in the URL. The customer's identity is keyed by their JWT, not by
  // which slug we send to /me, so this is correct for any registered
  // DataBundle customer.
  const paramSlug = typeof params?.storeSlug === 'string' ? params.storeSlug : null;

  // For root-level routes (/start-selling, /reseller, /account) there's no
  // slug in the URL. We can't use the platform slug as a blind fallback —
  // /me enforces customer.storeId === requested store, so calling /me with
  // platform slug for a customer who registered on agent X returns 403.
  // Resolve the slug from the most-recent fs_had_customer_<slug>=1 hint
  // in localStorage instead. The hint scan only runs once on the client.
  const resolvedRootSlug = (() => {
    if (paramSlug) return null;
    if (typeof window === 'undefined') return null;
    try {
      // Prefer platform slug if the customer has a hint for it (covers
      // anyone who registered directly via the platform storefront).
      const platform = getPlatformSlug();
      if (window.localStorage.getItem(`fs_had_customer_${platform}`) === '1') return platform;
      // Otherwise grab whichever store hint we find first — this is the
      // most recent store they signed in to.
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith('fs_had_customer_') && window.localStorage.getItem(k) === '1') {
          return k.slice('fs_had_customer_'.length);
        }
      }
    } catch (_) {}
    return null;
  })();

  const storeSlug = paramSlug || resolvedRootSlug || getPlatformSlug();

  // The owner portal lives at /{slug}/owner — a different auth domain.
  // We must NOT hit customer /auth/refresh or /me there: the owner has no
  // customer session on this store, so every call 401s and the failed
  // refresh + re-render churn was producing thousands of requests per
  // second (visible as the "POST /auth/refresh 401" loop in the console).
  const pathname = usePathname();
  const isOwnerRoute = typeof pathname === 'string' && pathname.includes('/owner');

  // Sticky hint that this visitor *previously* held a customer session on
  // this slug. Set by login(), cleared by logout(). Without this hint we
  // assume guest and skip the silent /auth/refresh + /me on first paint —
  // so a brand-new visitor (or an owner who never registered as their own
  // customer) doesn't see any 401 in the console. The cookie is the
  // source of truth; this is just a "should we even try" flag.
  //
  // For root-level pages (where we fell back to the platform slug), also
  // accept a hint from ANY store — a customer who registered on agent X
  // and then navigates to /start-selling shouldn't be treated as a guest
  // there just because there's no fs_had_customer_databundle hint.
  const SESSION_HINT_KEY = storeSlug ? `fs_had_customer_${storeSlug}` : null;
  const hadCustomerSession = (() => {
    if (typeof window === 'undefined') return false;
    try {
      if (SESSION_HINT_KEY && window.localStorage.getItem(SESSION_HINT_KEY) === '1') return true;
      // On root-level pages (no slug in URL) check whether ANY store hint
      // is set — the customer is signed in to *some* DataBundle store and
      // we should attempt the silent refresh.
      if (!paramSlug) {
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && k.startsWith('fs_had_customer_') && window.localStorage.getItem(k) === '1') return true;
        }
      }
    } catch (_) {}
    return false;
  })();

  const [status, setStatus] = useState('idle');
  const [customer, setCustomer] = useState(null);
  const [wallet, setWallet] = useState(null);

  const fetchMe = useCallback(async () => {
    if (!storeSlug) {
      setStatus('guest');
      return;
    }
    try {
      const res = await storePortal.me(storeSlug);
      setCustomer(res?.data?.customer || null);
      setWallet(res?.data?.wallet || null);
      setStatus('authed');
    } catch (err) {
      setCustomer(null);
      setWallet(null);
      setStatus('guest');
    }
  }, [storeSlug]);

  // Initial bootstrap: try silent refresh then load /me. Skipped on owner
  // routes (see isOwnerRoute comment above) — there's no customer session
  // there and the failed calls were hammering the API. Also skipped when
  // localStorage has no "I had a session here before" hint, so first-time
  // visitors and signed-in owners don't generate noisy 401s on every page.
  useEffect(() => {
    if (!storeSlug || isOwnerRoute || !hadCustomerSession) {
      setStatus('guest');
      return;
    }
    let cancelled = false;
    (async () => {
      setStatus('loading');
      // Single round-trip: api.js handles refresh-on-401-then-retry for
      // /me, so we don't need an explicit refresh() call first.
      if (!cancelled) await fetchMe();
    })();
    return () => { cancelled = true; };
  }, [storeSlug, fetchMe, isOwnerRoute, hadCustomerSession]);

  // Listen for any API-detected 401 (e.g. revoked session) and reset.
  // Also drop the session hint so the next page load doesn't even try
  // to refresh — it'll fall straight to 'guest' until the user logs in.
  useEffect(() => {
    const off = onUnauthorized(() => {
      clearAccessToken();
      setCustomer(null);
      setWallet(null);
      setStatus('guest');
      if (typeof window !== 'undefined' && SESSION_HINT_KEY) {
        try { window.localStorage.removeItem(SESSION_HINT_KEY); } catch (_) {}
      }
    });
    return off;
  }, [SESSION_HINT_KEY]);

  const login = useCallback(async (slug, email, password) => {
    const res = await storePortal.login(slug, { email, password });
    const token = res?.data?.accessToken;
    if (token) setAccessToken(token);
    setCustomer(res?.data?.customer || null);
    // /me has the live wallet; pull it.
    try {
      const me = await storePortal.me(slug);
      setWallet(me?.data?.wallet || null);
      setCustomer(me?.data?.customer || res?.data?.customer || null);
    } catch (_) {}
    setStatus('authed');
    // Remember we held a session here so the next page load attempts the
    // silent refresh instead of staying guest.
    if (typeof window !== 'undefined') {
      try { window.localStorage.setItem(`fs_had_customer_${slug}`, '1'); } catch (_) {}
    }
    return res;
  }, []);

  const logout = useCallback(async () => {
    if (!storeSlug) return;
    try { await storePortal.logout(storeSlug); } catch (_) {}
    clearAccessToken();
    setCustomer(null);
    setWallet(null);
    setStatus('guest');
    if (typeof window !== 'undefined' && SESSION_HINT_KEY) {
      try { window.localStorage.removeItem(SESSION_HINT_KEY); } catch (_) {}
    }
  }, [storeSlug, SESSION_HINT_KEY]);

  const value = {
    status,
    customer,
    wallet,
    storeSlug,
    refresh: fetchMe,
    login,
    logout,
    setCustomerData: (c) => setCustomer(c)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
