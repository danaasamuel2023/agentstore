'use client';

/**
 * /start-selling — turn a DataBundle customer into a primary agent.
 *
 * Flow:
 *   1. Customer must be logged in (any DataBundle store). We read their
 *      auth from useAuth() — same customer session.
 *   2. They fill out a tight form: store name + phone + WhatsApp.
 *   3. POST /api/store-portal/customer/become-agent.
 *   4. Success splash shows their storefront URL + a "Manage your store"
 *      button taking them to /reseller (which still requires a separate
 *      login for now — Slice C wires StoreCustomer auth into the
 *      reseller dashboard).
 *
 * If they're not signed in, we route them to the login flow on their
 * source store. The endpoint is auth-gated server-side anyway.
 */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowRight, CheckCircle2, Store, Share2, ExternalLink } from 'lucide-react';
import { useAuth } from '@/lib/fullstore/auth';
import { storePortal } from '@/lib/fullstore/api';

export default function StartSellingPage() {
  const router = useRouter();
  const { status, customer, storeSlug, refresh } = useAuth();

  const [storeName, setStoreName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [storeDescription, setStoreDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);

  // Pre-fill phone from the customer's saved data so they don't retype.
  useEffect(() => {
    if (customer?.phoneNumber && !contactPhone) {
      setContactPhone(customer.phoneNumber);
      setWhatsappNumber(customer.phoneNumber);
    }
    if (customer?.name && !storeName) {
      // Suggest a sensible default — they can override before submit.
      setStoreName(`${customer.name}'s Data Hub`);
    }
  }, [customer]);

  // Redirect to login only when we're SURE they're a guest — i.e. the
  // auth bootstrap has finished and status is settled at 'guest'. 'idle'
  // and 'loading' are pre-settled states; bouncing on those would push
  // a real signed-in user off the page before useAuth gets a chance to
  // confirm the session.
  useEffect(() => {
    if (status === 'guest') {
      router.replace('/');
    }
  }, [status, router]);

  // If the customer already owns a store, /start-selling is the wrong
  // page for them — there's nothing to "start". Send them to /reseller
  // where products, wallet, withdrawals, and order tabs all live.
  useEffect(() => {
    if (status === 'authed' && customer?.ownedStoreId) {
      router.replace('/reseller');
    }
  }, [status, customer?.ownedStoreId, router]);

  if (status === 'idle' || status === 'loading' || status === 'guest' || (status === 'authed' && customer?.ownedStoreId)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[color:var(--ink-faint)]" />
      </div>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!storeName.trim()) { setError('Store name is required'); return; }
    if (!contactPhone.trim() || contactPhone.replace(/\D/g, '').length < 10) {
      setError('Enter a valid contact phone number');
      return;
    }
    setSubmitting(true);
    try {
      // Use storePortal.becomeAgent — it pulls the in-memory access token
      // automatically and handles silent refresh on 401, which our raw
      // fetch + localStorage lookup couldn't do (the token isn't stored
      // in localStorage by design, it lives in memory only).
      const res = await storePortal.becomeAgent(storeSlug, {
        storeName: storeName.trim(),
        storeDescription: storeDescription.trim(),
        contactPhone: contactPhone.trim(),
        whatsappNumber: whatsappNumber.trim() || contactPhone.trim()
      });
      // Refresh the cached customer so customer.ownedStoreId becomes set
      // immediately — without this, navigating back to /start-selling or
      // hitting the popup would still see the create form because the
      // useAuth state is stale.
      try { await refresh(); } catch (_) {}
      setSuccess(res?.data);
    } catch (err) {
      // ALREADY_AGENT comes back as a non-2xx — apiRequest throws with
      // err.message; the data is on the thrown error too if we want it.
      if (err.code === 'ALREADY_AGENT' && err.data?.data?.storeSlug) {
        setSuccess({
          store: err.data.data,
          storefrontUrl: `https://databundle.shop/${err.data.data.storeSlug}`,
          alreadyHad: true
        });
      } else {
        setError(err.message || 'Failed to create store');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto px-4 py-10">
        <div className="card p-6 sm:p-8 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-7 h-7 text-green-600" />
          </div>
          <h1 className="text-xl font-black mb-1">
            {success.alreadyHad ? 'You already have a store!' : 'Your store is live!'}
          </h1>
          <p className="text-[13px] text-[color:var(--ink-mute)] mb-5">
            {success.store?.name || storeName}
          </p>

          <div className="bg-[color:var(--surface-2)] border border-[color:var(--border)] rounded-xl px-3 py-2.5 text-[12px] font-mono break-all mb-5">
            {success.storefrontUrl}
          </div>

          <div className="space-y-2">
            <a
              href={success.storefrontUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full btn btn-ghost h-11 px-4 text-[13px] justify-center"
            >
              <ExternalLink className="w-4 h-4" /> View my storefront
            </a>
            <Link
              href="/reseller"
              className="w-full btn btn-primary h-11 px-4 text-[13px] justify-center"
            >
              Open dashboard <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <p className="text-[11px] text-[color:var(--ink-faint)] mt-5">
            Manage your products, prices, and withdrawals at <strong>/reseller</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[color:var(--brand)]/15 flex items-center justify-center">
          <Store className="w-5 h-5 text-[color:var(--brand-deep)]" />
        </div>
        <div>
          <div className="text-[11px] uppercase tracking-wider text-[color:var(--ink-faint)] font-semibold">Become an Agent</div>
          <div className="text-base font-extrabold tracking-tight">Start your bundle store</div>
        </div>
      </div>

      <div className="card p-5 sm:p-6">
        <p className="text-[13px] text-[color:var(--ink-mute)] mb-5">
          Your storefront link will be{' '}
          <code className="font-mono text-[12px] bg-[color:var(--surface-2)] px-1.5 py-0.5 rounded">
            databundle.shop/your-store
          </code>
          . You set the prices — your profit is yours. Withdraw earnings to MoMo anytime.
        </p>

        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="block text-[12px] font-semibold text-[color:var(--ink-mute)] mb-1.5">Store name *</span>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g. Sam Data Hub"
              maxLength={80}
              className="input"
              required
            />
          </label>

          <label className="block">
            <span className="block text-[12px] font-semibold text-[color:var(--ink-mute)] mb-1.5">Contact phone *</span>
            <input
              type="tel"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              placeholder="024XXXXXXX"
              className="input"
              required
            />
          </label>

          <label className="block">
            <span className="block text-[12px] font-semibold text-[color:var(--ink-mute)] mb-1.5">WhatsApp (optional)</span>
            <input
              type="tel"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder="If different from contact phone"
              className="input"
            />
          </label>

          <label className="block">
            <span className="block text-[12px] font-semibold text-[color:var(--ink-mute)] mb-1.5">Tagline (optional)</span>
            <input
              type="text"
              value={storeDescription}
              onChange={(e) => setStoreDescription(e.target.value)}
              placeholder="Fast, cheap MTN/Telecel/AT bundles"
              maxLength={120}
              className="input"
            />
          </label>

          {error && (
            <div className="text-[12px] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-red-700 dark:text-red-400 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-primary w-full justify-center text-[14px] py-3 disabled:opacity-60"
          >
            {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating your store…</> : <>Create my store <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>
      </div>

      <p className="text-[11px] text-[color:var(--ink-faint)] text-center mt-4 flex items-center justify-center gap-1">
        <Share2 className="w-3 h-3" /> No fee, no approval queue — your store is live the moment you submit.
      </p>
    </div>
  );
}
