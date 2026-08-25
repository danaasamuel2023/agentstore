'use client';

/**
 * Reseller password reset.
 *
 * This route exists because the API already emails people here and nothing was
 * listening. subAgentPortalRoutes.js builds its reset link as
 *
 *   `${SUBAGENT_FRONTEND_URL}/sub-agent/reset-password?token=${rawToken}`
 *
 * and SUBAGENT_FRONTEND_URL falls back to https://www.cheapdata.shop when
 * neither SUB_AGENT_FRONTEND_URL nor FRONTEND_URL is set — which is the case on
 * VPS1. So every "forgot password" mail a reseller has ever received pointed at
 * a 404 on this domain. The path below matches that URL exactly; changing the
 * server would have invalidated links already sitting in people's inboxes.
 *
 * Deliberately outside /shop/[storeSlug]: the emailed link carries no store, so
 * there is no brand colour to inherit and no shop shell to render.
 */

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, Eye, EyeOff, CheckCircle2, KeyRound, AlertTriangle } from 'lucide-react';

const API_BASE = 'https://api.datamartgh.shop/api';

/* The API enforces 6; anything shorter is rejected server-side anyway, so the
   client just says so first rather than spending a round trip on it. */
const MIN_LENGTH = 6;

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (password.length < MIN_LENGTH) {
      setError(`Use at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError('The two passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(`${API_BASE}/subagent-portal/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setDone(true);
      } else {
        setError(data.message || 'That did not work. Request a new link and try again.');
      }
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  };

  /* A link with no token is someone who copied half a URL out of an email
     client. Say that, rather than showing a form that cannot possibly work. */
  if (!token) {
    return (
      <Card
        tone="bad"
        Icon={AlertTriangle}
        title="This link is incomplete"
        body="The reset link is missing its token, which usually means it was cut short when it was copied. Open the link straight from the email, or ask for a new one."
      />
    );
  }

  if (done) {
    return (
      <Card
        tone="ok"
        Icon={CheckCircle2}
        title="Password changed"
        body="You can sign in to the reseller portal with your new password now."
        action={
          <a href="https://agent.cheapdata.shop/login" className="btn btn-brand w-full">
            Go to the portal
          </a>
        }
      />
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-start gap-3.5 border-b border-hairline p-5">
        <span
          className="flex h-11 w-11 flex-none items-center justify-center rounded-lg"
          style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
        >
          <KeyRound className="h-5 w-5" />
        </span>
        <div className="pt-0.5">
          <h1 className="text-[17px]">Set a new password</h1>
          <p className="mt-0.5 text-[13px] leading-relaxed text-ink-3">
            For your reseller account. The link works once, and for 30 minutes.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4 p-5">
        <div className="space-y-1.5">
          <label htmlFor="new-password" className="eyebrow">
            New password
          </label>
          <div className="relative">
            <input
              id="new-password"
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="field pr-11"
              required
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-sm p-1.5 text-ink-4 transition-colors hover:text-ink"
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-[12px] text-ink-3">At least {MIN_LENGTH} characters.</p>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirm-password" className="eyebrow">
            Type it again
          </label>
          <input
            id="confirm-password"
            type={show ? 'text' : 'password'}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="field"
            required
          />
        </div>

        {error && (
          <p
            className="rounded-md px-3.5 py-3 text-[13px] leading-relaxed"
            style={{ background: 'var(--bad-soft)', color: 'var(--bad)' }}
          >
            {error}
          </p>
        )}

        <button type="submit" disabled={busy} className="btn btn-brand btn-lg w-full">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {busy ? 'Saving' : 'Save new password'}
        </button>
      </form>
    </div>
  );
}

function Card({ tone, Icon, title, body, action }) {
  return (
    <div className="card p-6 text-center">
      <span
        className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg"
        style={{ background: `var(--${tone}-soft)`, color: `var(--${tone})` }}
      >
        <Icon className="h-6 w-6" />
      </span>
      <h1 className="text-[17px]">{title}</h1>
      <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-ink-3">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-canvas px-4 py-14">
      <div className="mx-auto max-w-md">
        <Suspense
          fallback={
            <div className="flex min-h-[40vh] items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-ink-4" />
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
