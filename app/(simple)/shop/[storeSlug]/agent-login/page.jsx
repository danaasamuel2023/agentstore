'use client';

/**
 * Reseller sign-in.
 *
 * The dashboard itself lives at agent.cheapdata.shop, so signing in happens
 * there — this page hands people over. What it does own is the FORGOT PASSWORD
 * step, because that is the part that was broken.
 *
 * The API mails a link to `${SUBAGENT_FRONTEND_URL}/sub-agent/reset-password`,
 * and SUBAGENT_FRONTEND_URL falls back to www.cheapdata.shop when the env vars
 * are unset — which they are on VPS1. So the mail already lands on this domain;
 * it just had nowhere to land. See app/sub-agent/reset-password.
 *
 * Asking here rather than only on the portal also matches how people arrive:
 * they follow a shop link, find they cannot get in, and the shop is where they
 * already are.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ExternalLink, Loader2, Users, LogIn, MailCheck, KeyRound,
} from 'lucide-react';

const AGENT_PORTAL_URL = 'https://agent.cheapdata.shop';
const API_BASE = 'https://api.datamartgh.shop/api';

export default function AgentLoginPage() {
  const params = useParams();

  const [subAgentEnabled, setSubAgentEnabled] = useState(null);
  const [mode, setMode] = useState('signin'); // signin | forgot | sent
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/sub-agent/store/${params.storeSlug}/join-info`);
        const data = await res.json();
        if (!cancelled) setSubAgentEnabled(data.status === 'success');
      } catch {
        if (!cancelled) setSubAgentEnabled(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.storeSlug]);

  const requestReset = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/subagent-portal/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        // The API answers the same way whether or not the account exists, so it
        // never confirms an email address to someone guessing. Say it plainly
        // rather than implying a mail is definitely on its way.
        setMode('sent');
      } else {
        setError(data.message || 'Could not send the reset link. Try again.');
      }
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  if (subAgentEnabled === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-ink-4" />
      </div>
    );
  }

  if (subAgentEnabled === false) {
    return (
      <div className="mx-auto max-w-md py-10">
        <div className="card p-6 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-ink-4" />
          <h1 className="text-[18px]">No reseller programme here</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-3">
            This shop does not sign up resellers.
          </p>
          <Link href={`/shop/${params.storeSlug}`} className="btn btn-brand mt-5">
            Back to the shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-5 py-4">
      <Link
        href={`/shop/${params.storeSlug}`}
        className="inline-flex items-center gap-1.5 text-[13px] text-ink-3 transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to the shop
      </Link>

      {mode === 'sent' ? (
        <div className="card p-6 text-center">
          <span
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg"
            style={{ background: 'var(--ok-soft)', color: 'var(--ok)' }}
          >
            <MailCheck className="h-6 w-6" />
          </span>
          <h1 className="text-[17px]">Check your email</h1>
          <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-ink-3">
            If <span className="text-ink">{email}</span> belongs to a reseller account, a reset
            link is on its way. It works once, and for 30 minutes.
          </p>
          <button
            type="button"
            onClick={() => {
              setMode('forgot');
              setError('');
            }}
            className="btn btn-quiet mt-4 text-[13px]"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="flex items-start gap-3.5 border-b border-hairline p-5">
            <span
              className="flex h-11 w-11 flex-none items-center justify-center rounded-lg"
              style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
            >
              {mode === 'forgot' ? <KeyRound className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
            </span>
            <div className="pt-0.5">
              <h1 className="text-[17px]">
                {mode === 'forgot' ? 'Reset your password' : 'Reseller sign-in'}
              </h1>
              <p className="mt-0.5 text-[13px] leading-relaxed text-ink-3">
                {mode === 'forgot'
                  ? 'We will email you a link to set a new one.'
                  : 'Your dashboard, orders and wallet live on the reseller portal.'}
              </p>
            </div>
          </div>

          {mode === 'forgot' ? (
            <form onSubmit={requestReset} className="space-y-4 p-5">
              <div className="space-y-1.5">
                <label htmlFor="reset-email" className="eyebrow">
                  Email on your reseller account
                </label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field"
                />
              </div>

              {error && (
                <p
                  className="rounded-md px-3.5 py-3 text-[13px]"
                  style={{ background: 'var(--bad-soft)', color: 'var(--bad)' }}
                >
                  {error}
                </p>
              )}

              <button type="submit" disabled={busy} className="btn btn-brand btn-lg w-full">
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {busy ? 'Sending' : 'Email me a reset link'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setError('');
                }}
                className="btn btn-quiet w-full text-[13px]"
              >
                Back to sign in
              </button>
            </form>
          ) : (
            <div className="space-y-4 p-5">
              <a
                href={`${AGENT_PORTAL_URL}/login`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-brand btn-lg w-full"
              >
                Open the reseller portal
                <ExternalLink className="h-4 w-4" />
              </a>

              <p className="text-center text-[12.5px] text-ink-3">
                Opens <span className="num">agent.cheapdata.shop</span> in a new tab.
              </p>

              <div className="border-t border-hairline pt-4">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="btn btn-ghost w-full"
                >
                  <KeyRound className="h-4 w-4" />
                  Forgot your password?
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-center text-[13px] text-ink-3">
        Not a reseller yet?{' '}
        <Link
          href={`/shop/${params.storeSlug}/join`}
          className="font-medium text-brand transition-opacity hover:opacity-75"
        >
          Sell with us
        </Link>
      </p>
    </div>
  );
}
