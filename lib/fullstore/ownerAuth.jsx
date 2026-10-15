/**
 * Owner auth context — separate from customer AuthContext.
 *
 * Each store has at most one owner-session active in a tab. We track that
 * separately from customer state so an agent can be both the OWNER of a
 * store and a CUSTOMER on a different store in the same browser without
 * collisions.
 *
 * Public surface: useOwnerAuth() returning
 *   { status, owner, store, login(slug,email,password), logout(slug), refresh(slug) }
 */

'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  ownerPortal,
  setOwnerAccessToken,
  clearOwnerAccessToken,
  onOwnerUnauthorized
} from './api';

const OwnerAuthContext = createContext({
  status: 'idle',
  owner: null,
  store: null,
  storeSlug: null,
  refresh: async () => {},
  login: async () => {},
  verifyOtp: async () => {},
  resendOtp: async () => {},
  logout: async () => {}
});

export function OwnerAuthProvider({ children }) {
  const params = useParams();
  const storeSlug = typeof params?.storeSlug === 'string' ? params.storeSlug : null;

  // OwnerAuthProvider now wraps every storefront page (so TopNav can show
  // owner state), which means a bootstrap on every page hit. Without a
  // gate, brand-new visitors who have never owned this store generate
  // /auth/owner-refresh + /owner/me 401s on every visit. We mirror the
  // customer-side approach: only bootstrap when localStorage carries a
  // hint that this browser previously held an owner session here. Login
  // sets the hint, logout / server 401 clears it.
  const OWNER_HINT_KEY = storeSlug ? `fs_had_owner_${storeSlug}` : null;
  const hadOwnerSession = (() => {
    if (typeof window === 'undefined' || !OWNER_HINT_KEY) return false;
    try { return window.localStorage.getItem(OWNER_HINT_KEY) === '1'; } catch (_) { return false; }
  })();

  const [status, setStatus] = useState('idle');
  const [owner, setOwner] = useState(null);
  const [store, setStore] = useState(null);

  const fetchMe = useCallback(async () => {
    if (!storeSlug) {
      setStatus('guest');
      return;
    }
    try {
      const res = await ownerPortal.me(storeSlug);
      setOwner(res?.data?.owner || null);
      setStore(res?.data?.store || null);
      setStatus('authed');
    } catch (_) {
      setOwner(null);
      setStore(null);
      setStatus('guest');
    }
  }, [storeSlug]);

  // Bootstrap is now a single round-trip (api.js auto-retries refresh
  // on 401 from /me, so no need for an explicit refresh() first). And
  // we only run it when the localStorage hint says we *might* still
  // have a session — otherwise we go straight to guest with zero API
  // calls, eliminating the 401 spam on storefront pages.
  useEffect(() => {
    if (!storeSlug || !hadOwnerSession) {
      setStatus('guest');
      return;
    }
    let cancelled = false;
    (async () => {
      setStatus('loading');
      if (!cancelled) await fetchMe();
    })();
    return () => { cancelled = true; };
  }, [storeSlug, fetchMe, hadOwnerSession]);

  useEffect(() => {
    const off = onOwnerUnauthorized(() => {
      clearOwnerAccessToken();
      setOwner(null);
      setStore(null);
      setStatus('guest');
      if (typeof window !== 'undefined' && OWNER_HINT_KEY) {
        try { window.localStorage.removeItem(OWNER_HINT_KEY); } catch (_) {}
      }
    });
    return off;
  }, [OWNER_HINT_KEY]);

  // Step 1 of the OTP-gated login. Returns the raw response so the caller
  // can branch on `step: 'otp'` (always the case now — we always require
  // OTP) and show the code-entry form. Does NOT mark the session authed —
  // that happens in verifyOtp.
  const login = useCallback(async (slug, email, password) => {
    return ownerPortal.login(slug, { email, password });
  }, []);

  // Step 2 — { loginToken, code }. On success, sets the in-memory token and
  // flips status to authed.
  const verifyOtp = useCallback(async (slug, loginToken, code) => {
    const res = await ownerPortal.verifyOtp(slug, { loginToken, code });
    const token = res?.data?.accessToken;
    if (token) setOwnerAccessToken(token);
    setOwner(res?.data?.owner || null);
    setStore(res?.data?.store || null);
    setStatus('authed');
    if (typeof window !== 'undefined' && slug) {
      try { window.localStorage.setItem(`fs_had_owner_${slug}`, '1'); } catch (_) {}
    }
    return res;
  }, []);

  const resendOtp = useCallback(async (slug, loginToken) => {
    return ownerPortal.resendOtp(slug, { loginToken });
  }, []);

  // Discover variants — no slug needed; backend resolves the store from
  // the user's credentials and embeds the storeId in the returned
  // loginToken. After verifyOtp, the response carries the slug so the
  // caller knows where to redirect.
  const discoverLogin = useCallback(async (email, password, chosenStoreId) => {
    return ownerPortal.discoverLogin({ email, password, ...(chosenStoreId ? { chosenStoreId } : {}) });
  }, []);

  const discoverVerifyOtp = useCallback(async (loginToken, code) => {
    const res = await ownerPortal.discoverVerifyOtp({ loginToken, code });
    const token = res?.data?.accessToken;
    if (token) setOwnerAccessToken(token);
    setOwner(res?.data?.owner || null);
    setStore(res?.data?.store || null);
    setStatus('authed');
    // discover flow gets the slug back in the response; stash the hint
    // so future visits to that store's pages attempt the silent refresh.
    const discoveredSlug = res?.data?.store?.storeSlug || res?.data?.storeSlug;
    if (typeof window !== 'undefined' && discoveredSlug) {
      try { window.localStorage.setItem(`fs_had_owner_${discoveredSlug}`, '1'); } catch (_) {}
    }
    return res;
  }, []);

  const discoverResendOtp = useCallback(async (loginToken) => {
    return ownerPortal.discoverResendOtp({ loginToken });
  }, []);

  const logout = useCallback(async (slug) => {
    if (slug) {
      try { await ownerPortal.logout(slug); } catch (_) {}
    }
    clearOwnerAccessToken();
    setOwner(null);
    setStore(null);
    setStatus('guest');
    if (typeof window !== 'undefined' && slug) {
      try { window.localStorage.removeItem(`fs_had_owner_${slug}`, '1'); } catch (_) {}
    }
  }, []);

  return (
    <OwnerAuthContext.Provider value={{
      status, owner, store, storeSlug,
      refresh: fetchMe,
      login, verifyOtp, resendOtp,
      discoverLogin, discoverVerifyOtp, discoverResendOtp,
      logout
    }}>
      {children}
    </OwnerAuthContext.Provider>
  );
}

export function useOwnerAuth() {
  return useContext(OwnerAuthContext);
}
