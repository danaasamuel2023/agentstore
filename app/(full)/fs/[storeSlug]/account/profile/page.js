'use client';

/**
 * Customer profile editor.
 *
 * Two cards: profile (name + phone) and password change. Email is
 * intentionally read-only here — changing the address would need a
 * re-verification OTP round-trip that isn't built yet, so the field
 * shows the current value with a "contact support to change" hint.
 *
 * On a successful password change the backend revokes every OTHER
 * session for this customer, so the user stays signed in here but
 * any stolen tab/device is kicked.
 */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Loader2, ArrowLeft, User, Mail, Smartphone, Lock, Eye, EyeOff,
  CheckCircle2, Shield, AlertCircle
} from 'lucide-react';
import { useAuth } from '@/lib/fullstore/auth';
import { storePortal } from '@/lib/fullstore/api';
import { storeHref } from '@/lib/fullstore/links';

export default function ProfilePage() {
  const { storeSlug } = useParams();
  const router = useRouter();
  const { status, customer, refresh } = useAuth();

  useEffect(() => {
    if (status === 'guest') router.replace(storeHref(storeSlug, '/login'));
  }, [status, storeSlug, router]);

  if (status !== 'authed') {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[color:var(--ink-faint)]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <Link
        href={storeHref(storeSlug, '/account')}
        className="inline-flex items-center gap-1.5 text-[13px] text-[color:var(--ink-mute)] hover:text-[color:var(--ink)] mb-5"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to account
      </Link>

      <div className="mb-5">
        <div className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-faint)] font-semibold mb-1">My account</div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Profile</h1>
        <p className="text-[13px] text-[color:var(--ink-mute)] mt-1">
          Update your name, phone number, or password.
        </p>
      </div>

      <ProfileCard customer={customer} storeSlug={storeSlug} onSaved={refresh} />
      <div className="h-4" />
      <PasswordCard storeSlug={storeSlug} />
    </div>
  );
}

// ============================================================================
// Profile editor — name + phone (+ read-only email)
// ============================================================================

function ProfileCard({ customer, storeSlug, onSaved }) {
  const [name, setName] = useState(customer?.name || '');
  const [phone, setPhone] = useState(customer?.phoneNumber || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [savedAt, setSavedAt] = useState(0);

  // Keep local state in sync if the auth context refreshes underneath us.
  useEffect(() => {
    setName(customer?.name || '');
    setPhone(customer?.phoneNumber || '');
  }, [customer?.name, customer?.phoneNumber]);

  const trimmedName = name.trim();
  const cleanedPhone = phone.replace(/\D/g, '');
  const dirty =
    trimmedName !== (customer?.name || '') ||
    cleanedPhone !== (customer?.phoneNumber || '');
  const canSave = !saving && dirty && trimmedName.length >= 2;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    setError('');
    try {
      const body = {};
      if (trimmedName !== customer?.name) body.name = trimmedName;
      if (cleanedPhone !== customer?.phoneNumber) body.phoneNumber = cleanedPhone;
      await storePortal.updateProfile(storeSlug, body);
      try { await onSaved?.(); } catch (_) {}
      setSavedAt(Date.now());
    } catch (err) {
      if (err?.code === 'PHONE_IN_USE') {
        setError('That phone number is already on another account at this store.');
      } else {
        setError(err?.message || 'Could not save your changes. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl bg-[color:var(--surface)] border border-[color:var(--border)] shadow-sm p-5 sm:p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-lg bg-[color:var(--brand-glow)] text-[color:var(--brand-deep)] flex items-center justify-center">
          <User className="w-4 h-4" />
        </span>
        <h2 className="text-base font-black">Profile details</h2>
      </div>

      <div className="space-y-4">
        <Field label="Full name" icon={User}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            className="input pl-14"
            autoComplete="name"
            required
          />
        </Field>

        <Field label="Phone number" icon={Smartphone}>
          <input
            type="tel"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            maxLength={12}
            placeholder="0244000000"
            className="input pl-14"
            autoComplete="tel-national"
            required
          />
        </Field>

        <Field label="Email" icon={Mail}>
          <input
            type="email"
            value={customer?.email || ''}
            readOnly
            className="input pl-14 bg-[color:var(--surface-2)] text-[color:var(--ink-mute)] cursor-not-allowed"
          />
          <p className="text-[11px] text-[color:var(--ink-faint)] mt-1.5">
            Need to change your email? Reply to any of our emails and we'll move it.
          </p>
        </Field>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-3 py-2 text-[13px] text-red-900 dark:text-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {savedAt > 0 && !error && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 px-3 py-2 text-[13px] text-emerald-900 dark:text-emerald-200">
          <CheckCircle2 className="w-4 h-4" /> Profile saved.
        </div>
      )}

      <div className="mt-5 flex items-center justify-end">
        <button
          type="submit"
          disabled={!canSave}
          className="btn btn-primary disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

// ============================================================================
// Password change
// ============================================================================

function PasswordCard({ storeSlug }) {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNext, setShowNext] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validNew =
    typeof next === 'string' &&
    next.length >= 8 &&
    /[A-Za-z]/.test(next) &&
    /\d/.test(next);
  const matches = next === confirm;
  const differs = current && next && current !== next;
  const canSubmit = !saving && !!current && validNew && matches && differs;

  const submit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await storePortal.changePassword(storeSlug, {
        currentPassword: current,
        newPassword: next
      });
      setSuccess('Password updated. Other devices have been signed out.');
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setError(err?.message || 'Could not change your password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl bg-[color:var(--surface)] border border-[color:var(--border)] shadow-sm p-5 sm:p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="w-8 h-8 rounded-lg bg-[color:var(--brand-glow)] text-[color:var(--brand-deep)] flex items-center justify-center">
          <Lock className="w-4 h-4" />
        </span>
        <h2 className="text-base font-black">Change password</h2>
      </div>

      <div className="space-y-4">
        <Field label="Current password" icon={Lock}>
          <input
            type={showCurrent ? 'text' : 'password'}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            className="input pl-14 pr-12"
            autoComplete="current-password"
            required
          />
          <RevealButton on={showCurrent} setOn={setShowCurrent} />
        </Field>

        <Field label="New password" icon={Lock}>
          <input
            type={showNext ? 'text' : 'password'}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            className="input pl-14 pr-12"
            autoComplete="new-password"
            required
          />
          <RevealButton on={showNext} setOn={setShowNext} />
        </Field>
        <PasswordHints value={next} />

        <Field label="Confirm new password" icon={Lock}>
          <input
            type={showNext ? 'text' : 'password'}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="input pl-14"
            autoComplete="new-password"
            required
          />
          {confirm.length > 0 && !matches && (
            <p className="text-[11px] text-[color:var(--danger)] mt-1.5">Passwords don't match.</p>
          )}
        </Field>
      </div>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-3 py-2 text-[13px] text-red-900 dark:text-red-200">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800 px-3 py-2 text-[13px] text-emerald-900 dark:text-emerald-200">
          <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" /> {success}
        </div>
      )}

      <div className="mt-5 flex items-center justify-end">
        <button type="submit" disabled={!canSubmit} className="btn btn-primary disabled:opacity-50">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update password'}
        </button>
      </div>
    </form>
  );
}

function PasswordHints({ value }) {
  const items = [
    { ok: (value || '').length >= 8, text: 'At least 8 characters' },
    { ok: /[A-Za-z]/.test(value || ''), text: 'Contains a letter' },
    { ok: /\d/.test(value || ''), text: 'Contains a number' }
  ];
  return (
    <ul className="text-[11px] mt-1.5 grid grid-cols-1 sm:grid-cols-3 gap-1">
      {items.map((i) => (
        <li
          key={i.text}
          className={`inline-flex items-center gap-1.5 ${
            i.ok ? 'text-[color:var(--success)]' : 'text-[color:var(--ink-faint)]'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              i.ok ? 'bg-[color:var(--success)]' : 'bg-[color:var(--ink-faint)]'
            }`}
          />
          {i.text}
        </li>
      ))}
    </ul>
  );
}

function RevealButton({ on, setOn }) {
  return (
    <button
      type="button"
      onClick={() => setOn((v) => !v)}
      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-[color:var(--ink-mute)] hover:text-[color:var(--ink)] hover:bg-[color:var(--surface-2)] transition-colors"
      aria-label={on ? 'Hide password' : 'Show password'}
    >
      {on ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
    </button>
  );
}

function Field({ label, icon: Icon, children }) {
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
