'use client';

/**
 * Reseller auth context — wraps the /api/subagent-portal session for
 * the embedded /reseller/* dashboard inside databundle.shop. Pure
 * client-side, localStorage-backed.
 *
 * - status: 'loading' | 'authed' | 'guest'
 * - login(email, password) → resolves on success, throws on failure
 * - logout() → clears token + redirects to /reseller/login
 * - refresh() → re-fetches /auth/me into context
 */

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  resellerApi,
  setToken,
  clearSession,
  saveSession,
  getSavedUser,
  getSavedStore,
  getToken
} from './resellerApi';

const Ctx = createContext(null);

export function ResellerAuthProvider({ children }) {
  const router = useRouter();
  const [status, setStatus] = useState('loading');
  const [user, setUser] = useState(null);
  const [store, setStore] = useState(null);

  // Bootstrap from localStorage on mount.
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setStatus('guest');
      return;
    }
    const cachedUser = getSavedUser();
    const cachedStore = getSavedStore();
    if (cachedUser) setUser(cachedUser);
    if (cachedStore) setStore(cachedStore);
    // Validate token + refresh data in the background. If /auth/me 401s,
    // resellerApi already redirects to /reseller/login.
    resellerApi.me()
      .then((r) => {
        if (r?.data?.user) setUser(r.data.user);
        if (r?.data?.store) setStore(r.data.store);
        saveSession(r?.data?.user, r?.data?.store);
        setStatus('authed');
      })
      .catch(() => {
        // already redirected by interceptor; just flip state
        setStatus('guest');
      });
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await resellerApi.login(email, password);
    const token = res?.data?.token;
    if (!token) throw new Error('No session token returned');
    setToken(token);
    if (res?.data?.user) setUser(res.data.user);
    if (res?.data?.store) setStore(res.data.store);
    saveSession(res?.data?.user, res?.data?.store);
    setStatus('authed');
    return res.data;
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setStore(null);
    setStatus('guest');
    router.replace('/reseller/login');
  }, [router]);

  const refresh = useCallback(async () => {
    try {
      const r = await resellerApi.me();
      if (r?.data?.user) setUser(r.data.user);
      if (r?.data?.store) setStore(r.data.store);
      saveSession(r?.data?.user, r?.data?.store);
    } catch (_) { /* swallow — interceptor handles 401 */ }
  }, []);

  return (
    <Ctx.Provider value={{ status, user, store, login, logout, refresh, setStore }}>
      {children}
    </Ctx.Provider>
  );
}

export function useResellerAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useResellerAuth must be used inside <ResellerAuthProvider>');
  return v;
}
