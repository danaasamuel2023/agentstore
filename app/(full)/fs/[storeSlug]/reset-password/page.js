'use client';

import { Suspense, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { AuthShell } from '@/components/fullstore/AuthShell';
import { storePortal } from '@/lib/fullstore/api';
import { storeHref } from '@/lib/fullstore/links';

function ResetInner() {
  const { storeSlug } = useParams();
  const search = useSearchParams();
  const router = useRouter();
  const token = search.get('token');

  const [pw, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <AuthShell storeSlug={storeSlug} eyebrow="Account recovery" title="Reset link missing">
        <p className="text-[14px] text-[color:var(--ink-mute)]">
          This page needs a valid reset token. Click the link in your email or request a new one.
        </p>
        <Link href={storeHref(storeSlug, '/forgot-password')} className="btn btn-primary mt-5">Request a new link</Link>
      </AuthShell>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await storePortal.resetPassword(storeSlug, { token, newPassword: pw });
      setDone(true);
      setTimeout(() => router.push(storeHref(storeSlug, '/login')), 1500);
    } catch (err) {
      setError(err.message || 'Could not reset your password.');
      setLoading(false);
    }
  };

  return (
    <AuthShell
      storeSlug={storeSlug}
      eyebrow="Account recovery"
      title="Set a new password"
      subtitle="Pick something at least 8 characters, with a letter and a number."
    >
      {done ? (
        <div className="card-soft p-5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[color:var(--success)]/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-[color:var(--success)]" />
          </div>
          <h3 className="text-lg font-extrabold mt-3">Password reset</h3>
          <p className="text-[13px] text-[color:var(--ink-mute)] mt-1">Taking you to login…</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-[color:var(--ink-faint)] font-semibold ml-1 mb-1.5 block">New password</span>
            <span className="relative block">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-[color:var(--surface-2)] border border-[color:var(--border)] flex items-center justify-center text-[color:var(--ink-soft)] pointer-events-none">
                <Lock className="w-4 h-4" strokeWidth={2.25} />
              </span>
              <input
                type={showPw ? 'text' : 'password'}
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
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
            </span>
          </label>

          {error && (
            <div className="text-[13px] text-[color:var(--danger)] bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center mt-1 disabled:opacity-60">
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Resetting…</>
            ) : (
              <>Reset password <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetInner />
    </Suspense>
  );
}
