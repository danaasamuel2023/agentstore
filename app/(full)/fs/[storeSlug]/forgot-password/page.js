'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { AuthShell } from '@/components/fullstore/AuthShell';
import { storePortal } from '@/lib/fullstore/api';
import { storeHref } from '@/lib/fullstore/links';

export default function ForgotPasswordPage() {
  const { storeSlug } = useParams();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await storePortal.forgotPassword(storeSlug, { email });
      setSent(true);
    } catch {
      // Backend returns generic 200 regardless to avoid email enumeration —
      // do the same on the client.
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      storeSlug={storeSlug}
      eyebrow="Account recovery"
      title="Forgot your password?"
      subtitle="Enter the email you registered with. We'll send a reset link."
      footer={
        <>
          Remembered it?{' '}
          <Link href={storeHref(storeSlug, '/login')} className="font-semibold text-[color:var(--ink)] hover:underline">
            Back to login
          </Link>
        </>
      }
    >
      {sent ? (
        <div className="card-soft p-5 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[color:var(--success)]/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6 text-[color:var(--success)]" />
          </div>
          <h3 className="text-lg font-extrabold mt-3">Check your inbox</h3>
          <p className="text-[13px] text-[color:var(--ink-mute)] mt-1 leading-relaxed">
            If <strong className="text-[color:var(--ink)]">{email}</strong> has an account on this store, we just sent a reset link. It expires in 30 minutes.
          </p>
          <Link href={storeHref(storeSlug, '/login')} className="btn btn-primary mt-5">Back to login</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="text-[11px] uppercase tracking-wider text-[color:var(--ink-faint)] font-semibold ml-1 mb-1.5 block">Email</span>
            <span className="relative block">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-[color:var(--surface-2)] border border-[color:var(--border)] flex items-center justify-center text-[color:var(--ink-soft)] pointer-events-none">
                <Mail className="w-4 h-4" strokeWidth={2.25} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
                className="input pl-14"
              />
            </span>
          </label>

          <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center mt-2 disabled:opacity-60">
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
            ) : (
              <>Send reset link <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
