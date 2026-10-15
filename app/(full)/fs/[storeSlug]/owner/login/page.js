'use client';

/**
 * Owner login — two-step flow:
 *
 *   1. Email + password (the user's DataMart credentials) + ownership of
 *      the slug being addressed. Backend emails a 6-digit OTP to the
 *      DataMart-registered email and returns a 10-min loginToken.
 *   2. The 6-digit code. Backend trades { loginToken, code } for the real
 *      access JWT + refresh cookie.
 *
 * Possession of the password is not enough — control of the original
 * inbox is required too. Stolen DataMart passwords cannot reach the
 * owner dashboard.
 */

import { Suspense, useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck,
  KeyRound, RefreshCw, ChevronLeft
} from 'lucide-react';
import { AuthShell } from '@/components/fullstore/AuthShell';
import { useOwnerAuth } from '@/lib/fullstore/ownerAuth';
import { storeHref } from '@/lib/fullstore/links';

function OwnerLoginInner() {
  const { storeSlug } = useParams();
  const router = useRouter();
  const {
    login, verifyOtp, resendOtp,
    discoverLogin, discoverVerifyOtp, discoverResendOtp
  } = useOwnerAuth();

  // step: 'creds' | 'pick-store' | 'otp'
  const [step, setStep] = useState('creds');
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // When set, the OTP step is in DISCOVER mode (slugless). On verify success
  // we redirect to /{resolvedSlug}/owner instead of the URL's slug.
  const [discoverMode, setDiscoverMode] = useState(false);
  const [resolvedSlug, setResolvedSlug] = useState(null);

  // OTP-step state
  const [loginToken, setLoginToken] = useState(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0); // seconds
  const cooldownTimer = useRef(null);

  // Multi-store picker state (when discover finds >1 fullstore)
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

  // Common handler for a discover-API response. Sets the right next-step
  // (pick-store or otp) and primes the discover-mode flag so the OTP verify
  // call uses the right endpoint and we know to redirect by resolved slug.
  const handleDiscoverResponse = (res) => {
    const data = res?.data;
    if (data?.step === 'pick-store') {
      setPickerStores(data.stores || []);
      setStep('pick-store');
      setDiscoverMode(true);
    } else if (data?.step === 'otp' && data?.loginToken) {
      setLoginToken(data.loginToken);
      setMaskedEmail(data.maskedEmail || '');
      setResolvedSlug(data.store?.slug || null);
      setStep('otp');
      setDiscoverMode(true);
      startCooldown(60);
    } else {
      throw new Error('Unexpected response from server.');
    }
  };

  const submitCreds = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // First, try the slug-scoped login. If the user owns the slug in the
      // URL it goes through fast and shares the OTP path with discover.
      const res = await login(storeSlug, form.email, form.password);
      const data = res?.data;
      if (data?.step === 'otp' && data?.loginToken) {
        setLoginToken(data.loginToken);
        setMaskedEmail(data.maskedEmail || '');
        setResolvedSlug(storeSlug); // we know the slug — it's this URL
        setStep('otp');
        setDiscoverMode(false);
        startCooldown(60);
      } else {
        throw new Error('Unexpected response from server.');
      }
    } catch (err) {
      // The user's account doesn't own /{storeSlug}, but they might own a
      // different fullstore. Auto-fallback to discover so they don't have
      // to type their slug into the URL bar.
      if (err.code === 'NOT_STORE_OWNER') {
        try {
          const dres = await discoverLogin(form.email, form.password);
          handleDiscoverResponse(dres);
          return;
        } catch (derr) {
          if (derr.code === 'NO_FULLSTORE') {
            setError("This account doesn't own a full-store. Create one from your account dashboard first.");
          } else if (derr.code === 'GOOGLE_ONLY') {
            setError('Your account uses Google sign-in. Set a password from your account dashboard first.');
          } else if (derr.code === 'OTP_COOLDOWN') {
            setError(derr.message || 'A code was just sent. Wait a moment, then retry.');
          } else {
            setError(derr.message || 'Could not sign you in.');
          }
          return;
        }
      }
      if (err.code === 'GOOGLE_ONLY') {
        setError('Your account uses Google sign-in. Set a password from your account dashboard first.');
      } else if (err.code === 'OTP_COOLDOWN') {
        setError(err.message || 'A code was just sent. Wait a moment, then retry.');
      } else {
        setError(err.message || 'Could not sign you in.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Pick-store step — user has multiple fullstores and chose one. Re-submit
  // credentials with chosenStoreId so the backend can send the OTP for that
  // specific store.
  const submitStorePick = async (chosenStoreId) => {
    setError('');
    setLoading(true);
    try {
      const res = await discoverLogin(form.email, form.password, chosenStoreId);
      handleDiscoverResponse(res);
    } catch (err) {
      setError(err.message || 'Could not select that store.');
    } finally {
      setLoading(false);
    }
  };

  const submitOtp = async (e) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(otp)) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setLoading(true);
    try {
      // Use the right verify endpoint based on which flow we're in.
      if (discoverMode) {
        await discoverVerifyOtp(loginToken, otp);
      } else {
        await verifyOtp(storeSlug, loginToken, otp);
      }
      // Redirect to the OWNER dashboard for the slug we actually resolved.
      // In discover mode resolvedSlug may differ from the URL's slug.
      const slug = resolvedSlug || storeSlug;
      router.push(storeHref(slug, '/owner'));
    } catch (err) {
      if (err.code === 'WRONG_CODE') {
        setError('Wrong code. Check your email and try again.');
        setOtp('');
      } else if (err.code === 'LOGIN_TOKEN_EXPIRED') {
        setError('That sign-in session expired. Start over.');
        setStep('creds');
        setLoginToken(null);
        setOtp('');
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
      const res = discoverMode
        ? await discoverResendOtp(loginToken)
        : await resendOtp(storeSlug, loginToken);
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
    setDiscoverMode(false);
    setResolvedSlug(null);
    setPickerStores([]);
  };

  if (step === 'pick-store') {
    return (
      <AuthShell
        storeSlug={storeSlug}
        eyebrow="Which store?"
        title="Pick the store to manage"
        subtitle="You own more than one full-store. Choose which one to sign in to."
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
        eyebrow="Check your email"
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

  return (
    <AuthShell
      storeSlug={storeSlug}
      eyebrow="Store owner"
      title="Sign in as the owner"
      subtitle="Use your account email and password to manage this store."
      footer={
        <>
          Not the owner?{' '}
          <Link href={storeHref(storeSlug, '/login')} className="font-semibold text-[color:var(--ink)] hover:underline">
            Customer login
          </Link>
        </>
      }
    >
      <div className="mb-5 text-[13px] text-[color:var(--ink-mute)] bg-[color:var(--surface-2)] border border-[color:var(--border)] rounded-xl px-3 py-2.5 flex items-start gap-2">
        <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0 text-[color:var(--brand)]" />
        <span>
          We'll email a 6-digit code to your registered address to confirm it's really you.
        </span>
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

        {error && (
          <div className="text-[13px] text-[color:var(--danger)] bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center mt-1 disabled:opacity-60">
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Sending code…</>
          ) : (
            <>Continue <ArrowRight className="w-4 h-4" /></>
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

export default function OwnerLoginPage() {
  return (
    <Suspense fallback={null}>
      <OwnerLoginInner />
    </Suspense>
  );
}
