'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AuthShell } from '@/components/fullstore/AuthShell';
import { storePortal, setAccessToken } from '@/lib/fullstore/api';
import { storeHref } from '@/lib/fullstore/links';

/**
 * OTP entry — six separate digit inputs that behave like one cohesive field.
 * Auto-focus next on input, auto-back on Backspace, paste a 6-digit code
 * and it auto-fills + auto-submits.
 */
function VerifyInner() {
  const { storeSlug } = useParams();
  const router = useRouter();
  const search = useSearchParams();
  const email = search.get('email') || '';

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const refs = useRef([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => { refs.current[0]?.focus(); }, []);

  const setAt = (idx, v) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...digits];
    next[idx] = v;
    setDigits(next);
    if (v && idx < 5) refs.current[idx + 1]?.focus();
  };

  const onKey = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && idx > 0) refs.current[idx - 1]?.focus();
    if (e.key === 'ArrowRight' && idx < 5) refs.current[idx + 1]?.focus();
  };

  const onPaste = (e) => {
    const txt = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6);
    if (!txt) return;
    e.preventDefault();
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < txt.length; i++) next[i] = txt[i];
    setDigits(next);
    if (txt.length === 6) {
      submit(txt);
    } else {
      refs.current[txt.length]?.focus();
    }
  };

  const submit = async (codeOverride) => {
    const code = codeOverride || digits.join('');
    if (code.length !== 6) { setError('Enter the 6-digit code from your email'); return; }
    setError('');
    setLoading(true);
    try {
      const r = await storePortal.verifyOtp(storeSlug, { email, otp: code });
      // Backend now signs the customer in as part of verify (avoids
      // forcing them to retype the password they JUST set, which was
      // losing ~2% of signups to browser autofill mismatches).
      const token = r?.data?.accessToken;
      if (token) {
        setAccessToken(token);
        // Auth bootstrap on the next page only runs if this hint is
        // present — set it so /account doesn't bounce back to /login.
        try { localStorage.setItem(`fs_had_customer_${storeSlug}`, '1'); } catch (_) {}
        router.push(storeHref(storeSlug, '/account'));
      } else {
        router.push(storeHref(storeSlug, '/login?verified=1'));
      }
    } catch (err) {
      setError(err.message || 'Invalid code. Try again.');
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!email) return;
    setResending(true);
    setError('');
    try {
      await storePortal.resendOtp(storeSlug, { email });
      setResent(true);
      setTimeout(() => setResent(false), 4000);
    } catch (err) {
      setError(err.message || 'Could not resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell
      storeSlug={storeSlug}
      eyebrow="Step 2 of 2"
      title="Check your email"
      subtitle={
        email
          ? <>We sent a 6-digit code to <strong className="text-[color:var(--ink)]">{email}</strong>. Drop it in below.</>
          : 'Enter the 6-digit code we sent to your email.'
      }
      footer={
        <>
          Wrong email?{' '}
          <Link href={storeHref(storeSlug, '/register')} className="font-semibold text-[color:var(--ink)] hover:underline">
            Start over
          </Link>
        </>
      }
    >
      <div className="flex items-center justify-center gap-2" onPaste={onPaste}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={(el) => (refs.current[i] = el)}
            value={d}
            onChange={(e) => setAt(i, e.target.value.slice(-1))}
            onKeyDown={(e) => onKey(i, e)}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoComplete="one-time-code"
            className="w-11 h-14 sm:w-12 sm:h-16 text-center text-2xl font-black border border-[color:var(--border-strong)] rounded-2xl bg-[color:var(--surface)] focus:outline-none focus:border-[color:var(--ink)]"
          />
        ))}
      </div>

      {error && (
        <div className="mt-4 text-[13px] text-[color:var(--danger)] bg-red-50 border border-red-200 rounded-xl px-3 py-2">
          {error}
        </div>
      )}
      {resent && (
        <div className="mt-4 text-[13px] text-[color:var(--success)] bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4" /> New code sent. Check your inbox.
        </div>
      )}

      <button onClick={() => submit()} disabled={loading} className="btn btn-primary w-full justify-center mt-5 disabled:opacity-60">
        {loading ? (
          <><Loader2 className="w-4 h-4 animate-spin" /> Verifying…</>
        ) : (
          <>Verify &amp; continue <ArrowRight className="w-4 h-4" /></>
        )}
      </button>

      <div className="flex items-center justify-center gap-1.5 text-[12px] text-[color:var(--ink-mute)] mt-5">
        <Mail className="w-3 h-3" />
        Didn't get it?
        <button onClick={resend} disabled={resending || !email} className="font-semibold text-[color:var(--ink)] hover:underline disabled:opacity-50">
          {resending ? 'Sending…' : 'Resend code'}
        </button>
      </div>
    </AuthShell>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={null}>
      <VerifyInner />
    </Suspense>
  );
}
