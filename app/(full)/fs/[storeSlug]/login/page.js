'use client';

/**
 * Customer login — with transparent fallback to OWNER login.
 *
 * Same form, two audiences:
 *   - Customers (StoreCustomer) → existing flow, redirect to /account.
 *   - Store owners (User account on the main platform) → if the customer
 *     login returns 401, we silently try the slug-less owner discover
 *     login. If their credentials match a User who owns a fullstore, we
 *     send an OTP to their registered email and switch the page to a
 *     6-digit code prompt. After verification, redirect to /{slug}/owner.
 *
 * The page deliberately does NOT reveal that there's a separate "owner"
 * account system — that's a brand decision. Both flows look like one
 * smooth sign-in.
 */

import { Suspense, useState, useEffect, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2,
  KeyRound, RefreshCw, ChevronLeft, ShieldCheck, Zap
} from 'lucide-react';
import { AuthShell } from '@/components/fullstore/AuthShell';
import { useAuth } from '@/lib/fullstore/auth';
import { storeHref, isPlatformSlug } from '@/lib/fullstore/links';
import { ownerPortal, setOwnerAccessToken } from '@/lib/fullstore/api';

function LoginInner() {
  const { storeSlug } = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const justVerified = search.get('verified') === '1';
  const rawNext = search.get('next');
  const nextPath =
    typeof rawNext === 'string' && rawNext.startsWith('/') && !rawNext.startsWith('//')
      ? rawNext
      : null;

  // If they landed here because of a "buy" click on a specific bundle, the
  // next param looks like /{slug}/checkout?network=X&capacity=Y. Translate
  // that to the matching guest-checkout URL so the "Buy without account"
  // button keeps the customer's chosen bundle.
  const guestHref = (() => {
    const prefix = `/${storeSlug}/checkout`;
    if (nextPath && nextPath.startsWith(prefix)) {
      return `/${storeSlug}/guest/checkout` + nextPath.slice(prefix.length);
    }
    return storeHref(storeSlug, '/#bundles');
  })();

  const { login } = useAuth();

  // step: 'creds' | 'pick-store' | 'otp'
  const [step, setStep] = useState('creds');
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Owner-OTP state — only used when we fell through to the owner flow.
  const [loginToken, setLoginToken] = useState(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [resolvedSlug, setResolvedSlug] = useState(null);
  const [otp, setOtp] = useState('');
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownTimer = useRef(null);
  const [pickerStores, setPickerStores] = useState([]);

  const startCooldown = (s) => {
    setResendCooldown(s);
    clearInterval(cooldownTimer.current);
    cooldownTimer.current = setInterval(() => {
      setResendCooldown((v) => {
        if (v <= 1) { clearInterval(cooldownTimer.current); return 0; }
        return v - 1;
      });
    }, 1000);
  };
  useEffect(() => () => clearInterval(cooldownTimer.current), []);

  // Common handler for discover-API responses — switches to pick-store or
  // otp step based on the server's hint.
  const handleDiscoverResponse = (res) => {
    const data = res?.data;
    if (data?.step === 'pick-store') {
      setPickerStores(data.stores || []);
      setStep('pick-store');
    } else if (data?.step === 'otp' && data?.loginToken) {
      setLoginToken(data.loginToken);
      setMaskedEmail(data.maskedEmail || '');
      setResolvedSlug(data.store?.slug || null);
      setStep('otp');
      startCooldown(60);
    } else {
      throw new Error('Unexpected response from server.');
    }
  };

  // STEP 1 — single submit handler that tries customer first, falls back
  // to owner-discover silently on a generic 401.
  const submitCreds = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(storeSlug, form.email, form.password);
      // Default landing — platform users go to "/" (middleware sees the
      // fs_refresh cookie and silently rewrites to the account view, so
      // the URL stays clean). Agent-storefront customers go to the
      // store-scoped /{slug}/account.
      const defaultLanding = isPlatformSlug(storeSlug)
        ? '/'
        : storeHref(storeSlug, '/account');
      router.push(nextPath || defaultLanding);
    } catch (err) {
      // Customer flow has a dedicated "go verify your email" route.
      if (err.code === 'EMAIL_NOT_VERIFIED') {
        router.push(storeHref(storeSlug, `/verify?email=${encodeURIComponent(form.email)}`));
        return;
      }
      // Anything else (typically 401 invalid credentials) — try the
      // owner-discover path silently. If the user is actually an owner
      // logging in with their main-account password, we route them into
      // their store dashboard instead of saying "invalid credentials".
      try {
        const dres = await ownerPortal.discoverLogin({
          email: form.email,
          password: form.password
        });
        handleDiscoverResponse(dres);
      } catch (derr) {
        // Specific code suppression: if discover says "no fullstore", the
        // user genuinely isn't a store owner — the original customer 401
        // is the right answer.
        if (derr.code === 'NO_FULLSTORE') {
          setError('Invalid email or password');
        } else if (derr.code === 'GOOGLE_ONLY') {
          setError('Your account uses Google sign-in. Set a password from your account dashboard first.');
        } else if (derr.code === 'OTP_COOLDOWN') {
          setError(derr.message || 'A code was just sent. Wait a moment, then retry.');
        } else if (derr.status === 401) {
          setError('Invalid email or password');
        } else {
          setError(derr.message || 'Could not sign you in.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // STEP 2A — owner has multiple fullstores; user picks one.
  const submitStorePick = async (chosenStoreId) => {
    setError('');
    setLoading(true);
    try {
      const res = await ownerPortal.discoverLogin({
        email: form.email,
        password: form.password,
        chosenStoreId
      });
      handleDiscoverResponse(res);
    } catch (err) {
      setError(err.message || 'Could not select that store.');
    } finally {
      setLoading(false);
    }
  };

  // STEP 2B — 6-digit code verify. On success the api module stows the
  // access token in memory; we navigate to the owner dashboard for the
  // resolved slug (which may differ from the URL slug).
  const submitOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setLoading(true);
    try {
      const res = await ownerPortal.discoverVerifyOtp({ loginToken, code: otp });
      const token = res?.data?.accessToken;
      if (token) setOwnerAccessToken(token);
      const slug = res?.data?.store?.slug || resolvedSlug || storeSlug;
      router.push(storeHref(slug, '/owner'));
    } catch (err) {
      if (err.code === 'WRONG_CODE') {
        setError('Wrong code. Check your email and try again.');
        setOtp('');
      } else if (err.code === 'LOGIN_TOKEN_EXPIRED') {
        setError('That sign-in session expired. Start over.');
        backToCreds();
      } else {
        setError(err.message || 'Could not verify the code.');
      }
    } finally {
      setLoading(false);
    }
  };

  const doResend = async () => {
    if (resendCooldown > 0 || !loginToken) return;
    setResending(true);
    setError('');
    try {
      const res = await ownerPortal.discoverResendOtp({ loginToken });
      const t = res?.data?.loginToken;
      if (t) setLoginToken(t);
      startCooldown(60);
    } catch (err) {
      if (err.code === 'OTP_COOLDOWN' && err.data?.waitSec) {
        startCooldown(err.data.waitSec);
      }
      setError(err.message || 'Could not resend the code.');
    } finally {
      setResending(false);
    }
  };

  const backToCreds = () => {
    setStep('creds');
    setLoginToken(null);
    setOtp('');
    setError('');
    setResolvedSlug(null);
    setPickerStores([]);
  };

  // -----------------------------------------------------------------------
  // RENDER — three possible screens
  // -----------------------------------------------------------------------
  if (step === 'pick-store') {
    return (
      <AuthShell
        storeSlug={storeSlug}
        eyebrow="Which store?"
        title="Pick the store to manage"
        subtitle="You own more than one store. Choose which one to sign in to."
        footer={
          <button onClick={backToCreds} type="button" className="inline-flex items-center gap-1 font-semibold text-[color:var(--ink-mute)] hover:text-[color:var(--ink)]">
            <ChevronLeft className="w-3.5 h-3.5" /> Use a different account
          </button>
        }
      >
        {error && (
          <div className="mb-3 text-[13px] text-[color:var(--danger)] bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {error}
          </div>
        )}
        <div className="space-y-2">
          {pickerStores.map((s) => (
            <button
              key={s.id}
              type="button"
              disabled={loading}
              onClick={() => submitStorePick(s.id)}
              className="w-full text-left p-3.5 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] hover:border-[color:var(--ink)] disabled:opacity-50 transition-colors flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <div className="font-bold text-[14px] truncate">{s.name}</div>
                <div className="text-[12px] text-[color:var(--ink-mute)] font-mono truncate">/{s.slug}</div>
              </div>
              <ArrowRight className="w-4 h-4 text-[color:var(--ink-mute)] flex-shrink-0" />
            </button>
          ))}
        </div>
      </AuthShell>
    );
  }

  if (step === 'otp') {
    return (
      <AuthShell
        storeSlug={storeSlug}
        eyebrow="One more step"
        title="Enter the 6-digit code"
        subtitle={maskedEmail ? <>We sent a sign-in code to <b>{maskedEmail}</b>.</> : 'We sent a sign-in code to your email.'}
        footer={
          <button onClick={backToCreds} type="button" className="inline-flex items-center gap-1 font-semibold text-[color:var(--ink-mute)] hover:text-[color:var(--ink)]">
            <ChevronLeft className="w-3.5 h-3.5" /> Use a different account
          </button>
        }
      >
        <form onSubmit={submitOtp} className="space-y-3">
          <Field icon={KeyRound} label="6-digit code">
            <input
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="123456"
              autoFocus
              className="input pl-14 text-lg tracking-[0.4em] font-mono font-bold"
            />
          </Field>

          {error && (
            <div className="text-[13px] text-[color:var(--danger)] bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || otp.length !== 6} className="btn btn-primary w-full justify-center mt-1 disabled:opacity-60">
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
            ) : (
              <>Verify & sign in <ArrowRight className="w-4 h-4" /></>
            )}
          </button>

          <div className="pt-2 flex items-center justify-between text-[12px]">
            <span className="text-[color:var(--ink-mute)]">Didn't get it?</span>
            <button
              type="button"
              onClick={doResend}
              disabled={resending || resendCooldown > 0}
              className="inline-flex items-center gap-1 font-semibold text-[color:var(--ink-mute)] hover:text-[color:var(--ink)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : (resending ? 'Sending…' : 'Resend code')}
            </button>
          </div>
        </form>
      </AuthShell>
    );
  }

  // Default: credentials step
  return (
    <AuthShell
      storeSlug={storeSlug}
      eyebrow="Welcome back"
      title="Log in to your account"
      subtitle="Pick up where you left off."
      footer={
        <>
          New here?{' '}
          <Link href={storeHref(storeSlug, '/register')} className="font-semibold text-[color:var(--ink)] hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {justVerified && (
        <div className="mb-5 text-[13px] text-[color:var(--success)] bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" /> Email verified. Sign in to continue.
        </div>
      )}

      {/* No-account fast path — most customers don't want to read or sign up.
          Top-of-page banner so the easy option is the first thing they see. */}
      <Link
        href={guestHref}
        className="mb-5 block rounded-2xl bg-yellow-400 hover:bg-yellow-300 text-black p-4 border-2 border-black/10 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-black/10 flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5" strokeWidth={2.5} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-black leading-tight">Buy without an account</div>
            <div className="text-[12px] font-semibold opacity-70 mt-0.5">Pay with MoMo, bundle delivered in 1–5 min.</div>
          </div>
          <ArrowRight className="w-5 h-5 flex-shrink-0" />
        </div>
      </Link>

      <div className="mb-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] font-bold text-[color:var(--ink-faint)]">
        <span className="flex-1 h-px bg-[color:var(--border)]" />
        or sign in
        <span className="flex-1 h-px bg-[color:var(--border)]" />
      </div>

      {/* Owner hint — same form handles both audiences. If a store owner
          enters their credentials, the page silently switches to an OTP
          flow and routes them to their dashboard at /{slug}/owner. */}
      <div className="mb-4 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3.5 py-2.5 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-[color:var(--brand-deep)] mt-0.5 flex-shrink-0" />
        <div className="text-[12px] leading-snug">
          <span className="font-bold text-[color:var(--ink)]">Own this store?</span>{' '}
          <span className="text-[color:var(--ink-mute)]">
            Sign in here with your owner credentials to manage orders, withdrawals &amp; profit.
          </span>
        </div>
      </div>

      <form onSubmit={submitCreds} className="space-y-3">
        <Field icon={Mail} label="Email">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            autoComplete="email"
            required
            className="input pl-14"
          />
        </Field>

        <Field icon={Lock} label="Password">
          <input
            type={showPw ? 'text' : 'password'}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Your password"
            autoComplete="current-password"
            required
            className="input pl-14 pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-[color:var(--ink-mute)] hover:text-[color:var(--ink)] hover:bg-[color:var(--surface-2)] transition-colors"
            aria-label={showPw ? 'Hide password' : 'Show password'}
          >
            {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </Field>

        <div className="flex justify-end">
          <Link href={storeHref(storeSlug, '/forgot-password')} className="text-[12px] font-semibold text-[color:var(--ink-mute)] hover:text-[color:var(--ink)]">
            Forgot password?
          </Link>
        </div>

        {error && (
          <div className="text-[13px] text-[color:var(--danger)] bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center mt-1 disabled:opacity-60">
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Signing you in…</>
          ) : (
            <>Log in <ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </form>
    </AuthShell>
  );
}

function Field({ icon: Icon, label, children }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-[color:var(--ink-faint)] font-semibold ml-1 mb-1.5 block">
        {label}
      </span>
      <span className="relative block">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-[color:var(--surface-2)] border border-[color:var(--border)] flex items-center justify-center text-[color:var(--ink-soft)] pointer-events-none">
          <Icon className="w-4 h-4" strokeWidth={2.25} />
        </span>
        {children}
      </span>
    </label>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
