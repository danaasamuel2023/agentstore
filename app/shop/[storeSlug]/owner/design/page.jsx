'use client';

/**
 * Store design editor — the owner-facing half of the redesign.
 *
 * Everything here writes to endpoints that already exist:
 *   POST /api/v1/login  (+ /login/verify-otp, /login/verify-totp)
 *   GET  /api/v1/agent-stores/stores/mine          -> resolve slug to storeId
 *   GET  /api/v1/agent-stores/store/:slug          -> current customization
 *   PUT  /api/v1/agent-stores/stores/:id/update    -> save
 *
 * The preview is the real storefront components rendered against un-saved
 * values, so "what you see" and "what ships" cannot drift apart.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, Check, Eye, Loader2, LogOut, AlertTriangle, RotateCcw, ExternalLink,
} from 'lucide-react';
import {
  BRAND_PRESETS, DEFAULT_BRAND, HERO_STYLES, NAV_STYLES,
  normaliseHex, brandContrastNote, readableOn, pickSaveableCustomization,
} from '@/lib/storeTheme';
import {
  login, verifyCode, resendOtp, fetchPublicStore, fetchMyStores,
  saveStoreSettings, getToken, clearToken,
} from '@/lib/ownerSession';
import DesignPreview from './DesignPreview';

const API = 'https://api.datamartgh.shop/api/v1';

/* The schema enums predate this editor and carry values the redesign dropped:
   heroStyle 'gradient' and 'wave' (the gradient hero is exactly what we
   removed), and navStyle 'branded'. Live stores are sitting on them right now.
   Fold each onto its nearest surviving option so an existing owner opens the
   editor with something selected rather than an empty radio group. The old
   value stays in the database until they save. */
const LEGACY = {
  heroStyle: { gradient: 'default', wave: 'default' },
  navStyle: { branded: 'default' },
};

const settle = (field, value, fallback) => {
  if (!value) return fallback;
  return LEGACY[field]?.[value] || value;
};

/** Hero text lives in `customization` too, but those two fields are newer than
 *  the rest. saveStoreSettings reports anything the server drops, and we surface
 *  it rather than showing a false "Saved". */
const draftFromStore = (store) => ({
  storeName: store?.storeName || '',
  storeDescription: store?.storeDescription || '',
  storeLogo: store?.storeLogo || '',
  primaryColor: normaliseHex(store?.customization?.primaryColor) || DEFAULT_BRAND,
  heroStyle: settle('heroStyle', store?.customization?.heroStyle, 'default'),
  navStyle: settle('navStyle', store?.customization?.navStyle, 'default'),
  heroHeadline: store?.customization?.heroHeadline || '',
  heroSubheadline: store?.customization?.heroSubheadline || '',
});

/* -------------------------------------------------------------------------- */
/* Sign in                                                                    */
/* -------------------------------------------------------------------------- */

function SignIn({ storeSlug, onSignedIn }) {
  const [stage, setStage] = useState('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const submitPassword = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const result = await login(email, password);
      if (result.done) return onSignedIn();
      setPending(result);
      setStage(result.step);
      setNotice(
        result.step === 'otp'
          ? `We sent a code to ${result.target || 'your phone'}.`
          : 'Enter the code from your authenticator app.'
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await verifyCode(pending.step, pending.loginToken, code);
      onSignedIn();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    setError('');
    try {
      await resendOtp(pending.loginToken);
      setNotice('Sent again. It can take a minute to arrive.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="mx-auto max-w-sm py-10">
      <Link
        href={`/shop/${storeSlug}`}
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] text-ink-3 transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to the shop
      </Link>

      <div className="card p-6">
        <h1 className="text-[19px]">Store design</h1>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">
          Sign in with the DataMart account that owns this store to change how it looks.
        </p>

        {error && (
          <p className="mt-4 rounded-sm px-3 py-2 text-[13px]" style={{ background: 'var(--bad-soft)', color: 'var(--bad)' }}>
            {error}
          </p>
        )}
        {!error && notice && (
          <p className="mt-4 rounded-sm px-3 py-2 text-[13px]" style={{ background: 'var(--ok-soft)', color: 'var(--ok)' }}>
            {notice}
          </p>
        )}

        {stage === 'password' ? (
          <form onSubmit={submitPassword} className="mt-5 space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="owner-email" className="eyebrow">Email</label>
              <input
                id="owner-email"
                type="email"
                required
                autoComplete="email"
                className="field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="owner-password" className="eyebrow">Password</label>
              <input
                id="owner-password"
                type="password"
                required
                autoComplete="current-password"
                className="field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-brand w-full" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </button>
          </form>
        ) : (
          <form onSubmit={submitCode} className="mt-5 space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="owner-code" className="eyebrow">Code</label>
              <input
                id="owner-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                className="field num tracking-[0.3em]"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>
            <button type="submit" className="btn btn-brand w-full" disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Continue
            </button>
            {pending?.step === 'otp' && (
              <button type="button" onClick={resend} className="btn btn-quiet w-full text-[13px]">
                Send the code again
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Controls                                                                   */
/* -------------------------------------------------------------------------- */

function Group({ title, hint, children }) {
  return (
    <section className="border-b border-hairline pb-6 last:border-0 last:pb-0">
      <h2 className="text-[14px]">{title}</h2>
      {hint && <p className="mt-1 text-[12.5px] leading-relaxed text-ink-3">{hint}</p>}
      <div className="mt-3.5 space-y-3">{children}</div>
    </section>
  );
}

function Text({ label, value, onChange, placeholder, maxLength, multiline }) {
  const Tag = multiline ? 'textarea' : 'input';
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label className="eyebrow">{label}</label>
        {maxLength && (
          <span className="num text-[11px] text-ink-4">
            {value.length}/{maxLength}
          </span>
        )}
      </div>
      <Tag
        className="field"
        style={multiline ? { height: 78, padding: '.6rem .8rem', lineHeight: 1.5 } : undefined}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function Choices({ options, value, onChange }) {
  return (
    <div className="stack">
      {options.map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className="flex w-full items-start gap-3 px-3.5 py-3 text-left transition-colors hover:bg-sunken"
          >
            <span
              className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border"
              style={{
                borderColor: active ? 'var(--brand)' : 'var(--hairline-strong)',
                background: active ? 'var(--brand)' : 'transparent',
              }}
            >
              {active && <Check className="h-2.5 w-2.5" style={{ color: 'var(--brand-ink)' }} />}
            </span>
            <span className="min-w-0">
              <span className="block text-[13.5px] font-medium text-ink">{option.name}</span>
              <span className="block text-[12px] leading-relaxed text-ink-3">{option.hint}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ColourPicker({ value, onChange }) {
  const warning = brandContrastNote(value);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {BRAND_PRESETS.map((preset) => {
          const active = value.toLowerCase() === preset.hex.toLowerCase();
          return (
            <button
              key={preset.id}
              type="button"
              title={preset.name}
              aria-label={preset.name}
              onClick={() => onChange(preset.hex)}
              className="flex h-9 w-9 items-center justify-center rounded-md transition-transform hover:scale-105"
              style={{
                background: preset.hex,
                boxShadow: active ? '0 0 0 2px var(--paper), 0 0 0 4px var(--ink)' : 'none',
              }}
            >
              {active && <Check className="h-4 w-4" style={{ color: readableOn(preset.hex) }} />}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 flex-none cursor-pointer rounded-sm border border-hairline-strong bg-paper p-1"
          aria-label="Pick any colour"
        />
        <input
          className="field num uppercase"
          value={value}
          maxLength={7}
          onChange={(e) => {
            const next = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
            const clean = normaliseHex(next);
            onChange(clean || next);
          }}
          aria-label="Brand colour hex code"
        />
      </div>

      {warning && (
        <p className="flex items-start gap-2 text-[12px] leading-relaxed" style={{ color: 'var(--warn)' }}>
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />
          {warning}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function OwnerDesignPage() {
  const { storeSlug } = useParams();

  const [authed, setAuthed] = useState(false);
  const [phase, setPhase] = useState('loading'); // loading | ready | denied | missing | error
  const [message, setMessage] = useState('');

  const [store, setStore] = useState(null);
  const [storeId, setStoreId] = useState(null);
  const [products, setProducts] = useState([]);

  const [draft, setDraft] = useState(draftFromStore(null));
  const savedRef = useRef(draftFromStore(null));

  const [saving, setSaving] = useState(false);
  const [saveState, setSaveState] = useState(null); // { tone, text }
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    setAuthed(Boolean(getToken()));
  }, []);

  const load = useCallback(async () => {
    setPhase('loading');
    try {
      const [publicStore, myStores] = await Promise.all([
        fetchPublicStore(storeSlug),
        fetchMyStores(),
      ]);

      if (!publicStore) {
        setPhase('missing');
        return;
      }

      const owned = myStores.find(
        (s) => String(s.storeSlug).toLowerCase() === String(storeSlug).toLowerCase()
      );

      if (!owned) {
        setPhase('denied');
        setMessage(
          myStores.length
            ? 'That account owns other stores, but not this one.'
            : 'That account does not own any stores.'
        );
        return;
      }

      const next = draftFromStore(publicStore);
      setStore(publicStore);
      setStoreId(owned._id);
      setDraft(next);
      savedRef.current = next;
      setPhase('ready');

      // Preview fidelity only — a store with no catalogue still edits fine.
      try {
        const res = await fetch(`${API}/agent-stores/stores/${storeSlug}/products`);
        const data = await res.json();
        if (data.status === 'success') setProducts(data.data?.products || []);
      } catch {
        /* sample bundles will stand in */
      }
    } catch (err) {
      if (err.status === 401) {
        setAuthed(false);
        return;
      }
      setPhase('error');
      setMessage(err.message);
    }
  }, [storeSlug]);

  useEffect(() => {
    if (authed) load();
  }, [authed, load]);

  const dirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(savedRef.current),
    [draft]
  );

  const set = (key) => (value) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setSaveState(null);
  };

  const save = async () => {
    const colour = normaliseHex(draft.primaryColor);
    if (!colour) {
      setSaveState({ tone: 'bad', text: 'That colour code is not valid. Use a form like #0E7C5A.' });
      return;
    }

    setSaving(true);
    setSaveState(null);
    try {
      const { store: updated, dropped } = await saveStoreSettings(storeId, {
        storeName: draft.storeName.trim() || undefined,
        storeDescription: draft.storeDescription,
        storeLogo: draft.storeLogo.trim(),
        customization: pickSaveableCustomization({
          primaryColor: colour,
          heroStyle: draft.heroStyle,
          navStyle: draft.navStyle,
          heroHeadline: draft.heroHeadline.trim(),
          heroSubheadline: draft.heroSubheadline.trim(),
        }),
      });

      savedRef.current = { ...draft, primaryColor: colour };
      setDraft(savedRef.current);
      if (updated) setStore(updated);

      if (dropped.length) {
        setSaveState({
          tone: 'warn',
          text: `Saved, but the server did not keep: ${dropped.join(', ')}. That store field is not live on the API yet.`,
        });
      } else {
        setSaveState({ tone: 'ok', text: 'Saved. Your shop updates for customers within the hour.' });
      }
    } catch (err) {
      setSaveState({ tone: 'bad', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const revert = () => {
    setDraft(savedRef.current);
    setSaveState(null);
  };

  const signOut = () => {
    clearToken();
    setAuthed(false);
    setStore(null);
    setPhase('loading');
  };

  if (!authed) {
    return <SignIn storeSlug={storeSlug} onSignedIn={() => setAuthed(true)} />;
  }

  if (phase === 'loading') {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-ink-4" />
      </div>
    );
  }

  if (phase !== 'ready') {
    const copy = {
      denied: ['You cannot edit this store', message],
      missing: ['Store not found', 'Nothing is published at this address.'],
      error: ['Something went wrong', message],
    }[phase];

    return (
      <div className="mx-auto max-w-sm py-10">
        <div className="card p-6 text-center">
          <h1 className="text-[18px]">{copy[0]}</h1>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-3">{copy[1]}</p>
          <div className="mt-5 flex justify-center gap-2">
            <button type="button" onClick={signOut} className="btn btn-ghost">
              Use another account
            </button>
            <Link href={`/shop/${storeSlug}`} className="btn btn-brand">
              Back to the shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline pb-5">
        <div>
          <p className="eyebrow">{store?.storeName}</p>
          <h1 className="mt-1 text-[22px]">Store design</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/shop/${storeSlug}`} className="btn btn-quiet text-[13px]">
            <ExternalLink className="h-3.5 w-3.5" />
            View shop
          </Link>
          <button type="button" onClick={signOut} className="btn btn-quiet text-[13px]">
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        {/* Controls */}
        <div className="space-y-6">
          <Group title="Brand colour" hint="Used for buttons, links and the bar across the top of your shop.">
            <ColourPicker value={draft.primaryColor} onChange={set('primaryColor')} />
          </Group>

          <Group
            title="Shop name and logo"
            hint="Your name is the biggest thing on the page — it is the headline, so write it the way you want customers to say it."
          >
            <Text label="Shop name" value={draft.storeName} onChange={set('storeName')} maxLength={60} />
            <Text
              label="Logo link"
              value={draft.storeLogo}
              onChange={set('storeLogo')}
              placeholder="https://…/logo.png"
            />
            <p className="text-[12px] leading-relaxed text-ink-3">
              Paste a link to a square image. There is no upload here yet — a WhatsApp image
              link or any public image address works. A small or blurry file will look blurry
              at the size the shop shows it.
            </p>
          </Group>

          <Group title="Tagline" hint="The line under your name. One short sentence does more than three.">
            <Text
              label="Tagline"
              value={draft.heroHeadline}
              onChange={set('heroHeadline')}
              placeholder="Cheap bundles, delivered fast."
              maxLength={70}
            />
            <Text
              label="About this shop"
              value={draft.storeDescription}
              onChange={set('storeDescription')}
              placeholder="Shown in the footer, and to Google."
              maxLength={200}
              multiline
            />
          </Group>

          <Group title="Shop header" hint="The coloured band at the top of your shop.">
            <Choices options={HERO_STYLES} value={draft.heroStyle} onChange={set('heroStyle')} />
          </Group>


          <Group title="Menu">
            <Choices options={NAV_STYLES} value={draft.navStyle} onChange={set('navStyle')} />
          </Group>
        </div>

        {/* Preview */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="eyebrow">Preview</p>
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="btn btn-quiet text-[12px] lg:hidden"
            >
              <Eye className="h-3.5 w-3.5" />
              {showPreview ? 'Hide' : 'Show'}
            </button>
          </div>

          <div className={showPreview ? '' : 'hidden lg:block'}>
            <DesignPreview draft={draft} store={store} products={products} />
            <p className="mt-2 text-[11.5px] text-ink-3">
              Live. Nothing here is public until you save.
            </p>
          </div>
        </div>
      </div>

      {/* Save bar. Sticky because the controls are long and the owner should
          never have to hunt for the button that commits their work. */}
      <div className="sticky bottom-0 -mx-4 border-t border-hairline bg-paper/95 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p
            className="min-w-0 flex-1 text-[12.5px] leading-relaxed"
            style={{
              color: saveState
                ? `var(--${saveState.tone === 'ok' ? 'ok' : saveState.tone === 'warn' ? 'warn' : 'bad'})`
                : 'var(--ink-3)',
            }}
          >
            {saveState?.text || (dirty ? 'You have unsaved changes.' : 'Everything is saved.')}
          </p>

          <div className="flex items-center gap-2">
            {dirty && (
              <button type="button" onClick={revert} className="btn btn-quiet text-[13px]">
                <RotateCcw className="h-3.5 w-3.5" />
                Undo changes
              </button>
            )}
            <button type="button" onClick={save} className="btn btn-brand" disabled={saving || !dirty}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
