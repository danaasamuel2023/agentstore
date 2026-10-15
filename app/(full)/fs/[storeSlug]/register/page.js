'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Phone, Lock, User, Eye, EyeOff, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AuthShell } from '@/components/fullstore/AuthShell';
import { storePortal } from '@/lib/fullstore/api';
import { storeHref } from '@/lib/fullstore/links';

const PHONE_HINT = '024 000 0000';

export default function RegisterPage() {
  const { storeSlug } = useParams();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phoneNumber: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [agree, setAgree] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const pwStrength = (() => {
    const p = form.password || '';
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/\d/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s; // 0..4
  })();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!agree) { setError('Please accept the terms to continue'); return; }

    setLoading(true);
    try {
      await storePortal.register(storeSlug, form);
      router.push(storeHref(storeSlug, `/verify?email=${encodeURIComponent(form.email)}`));
    } catch (err) {
      setError(err.message || 'Could not create your account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      storeSlug={storeSlug}
      eyebrow="Step 1 of 2"
      title="Create your account"
      subtitle="Takes 30 seconds. We email you a code, you confirm, you're in."
      footer={
        <>
          Already have one?{' '}
          <Link href={storeHref(storeSlug, '/login')} className="font-semibold text-[color:var(--ink)] hover:underline">
            Log in instead
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-3">
        <Field icon={User} label="Your name">
          <input
            type="text"
            value={form.name}
            onChange={update('name')}
            placeholder="Kwame Asante"
            autoComplete="name"
            required
            className="input pl-14"
          />
        </Field>

        <Field icon={Mail} label="Email">
          <input
            type="email"
            value={form.email}
            onChange={update('email')}
            placeholder="you@example.com"
            autoComplete="email"
            required
            className="input pl-14"
          />
        </Field>

        <Field icon={Phone} label="Phone number">
          <input
            type="tel"
            value={form.phoneNumber}
            onChange={update('phoneNumber')}
            placeholder={PHONE_HINT}
            autoComplete="tel"
            inputMode="numeric"
            required
            className="input pl-14"
          />
        </Field>

        <Field icon={Lock} label="Password">
          <input
            type={showPw ? 'text' : 'password'}
            value={form.password}
            onChange={update('password')}
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
        </Field>

        {/* Strength meter — never green-glowing for weak input */}
        {form.password.length > 0 && (
          <div className="flex items-center gap-1.5 px-1">
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`flex-1 h-1 rounded-full transition-colors ${
                  pwStrength >= i
                    ? pwStrength <= 2 ? 'bg-orange-400' : 'bg-[color:var(--success)]'
                    : 'bg-[color:var(--border-strong)]'
                }`}
              />
            ))}
            <span className="text-[10px] text-[color:var(--ink-faint)] ml-1 font-semibold uppercase tracking-wider min-w-[44px] text-right">
              {pwStrength <= 1 ? 'weak' : pwStrength <= 2 ? 'okay' : pwStrength <= 3 ? 'good' : 'strong'}
            </span>
          </div>
        )}

        <label className="flex items-start gap-2 text-[12px] text-[color:var(--ink-mute)] mt-1.5 cursor-pointer">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-0.5 accent-[color:var(--ink)]"
          />
          <span>
            I agree to the <a href="#" className="font-semibold text-[color:var(--ink)] hover:underline">Terms</a> and <a href="#" className="font-semibold text-[color:var(--ink)] hover:underline">Privacy Policy</a>.
          </span>
        </label>

        {error && (
          <div className="text-[13px] text-[color:var(--danger)] bg-red-50 border border-red-200 rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary w-full justify-center mt-2 disabled:opacity-60">
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Creating your account…</>
          ) : (
            <>Continue <ArrowRight className="w-4 h-4" /></>
          )}
        </button>

        <div className="flex items-center gap-1.5 text-[11px] text-[color:var(--ink-faint)] justify-center pt-1">
          <CheckCircle2 className="w-3 h-3" /> Email verification required · No spam, ever
        </div>
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
        {/* Icon sits inside a small contrasting chip so it never blends
           with the placeholder. The chip is non-interactive — the input
           still receives clicks across its whole surface. */}
        <span className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-lg bg-[color:var(--surface-2)] border border-[color:var(--border)] flex items-center justify-center text-[color:var(--ink-soft)] pointer-events-none">
          <Icon className="w-4 h-4" strokeWidth={2.25} />
        </span>
        {children}
      </span>
    </label>
  );
}
