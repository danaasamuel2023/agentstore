'use client';

import { MessageCircle, ArrowDown } from 'lucide-react';
import { useLiveDesign } from '@/lib/fullstore/liveDesign';
import { DeliveryEtaBanner } from '@/components/fullstore/DeliveryEta';

/**
 * The header at the top of a store's home page: name, the owner's own
 * headline and sub-line when their design has them, and WhatsApp.
 *
 * `design` is the saved design (or null — the header then reads exactly as it
 * always did). In the dashboard's live preview the draft replaces it.
 *
 * What the design changes here:
 *   heroStyle   default = full header · split = header + live delivery card
 *               beside it · minimal = slim header
 *   heroPattern dots · grid · waves · none — a texture in the store's colour
 *   heroAlign   left · center
 *   headline, subheadline, ctaLabel (a button down to the bundles)
 */

/* Textures drawn in the brand colour, faded out towards the bottom-right so
   text over them stays readable. */
function HeroPattern({ kind }) {
  if (!kind || kind === 'none') return null;
  const fade = {
    maskImage: 'radial-gradient(120% 100% at 0% 0%, #000 25%, transparent 75%)',
    WebkitMaskImage: 'radial-gradient(120% 100% at 0% 0%, #000 25%, transparent 75%)',
  };
  if (kind === 'grid') {
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(color-mix(in srgb, var(--brand-text) 22%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--brand-text) 22%, transparent) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          ...fade,
        }}
      />
    );
  }
  if (kind === 'waves') {
    return (
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 w-full sm:h-32"
        viewBox="0 0 1200 160"
        preserveAspectRatio="none"
      >
        <path d="M0 90 C 200 40 400 140 600 90 S 1000 40 1200 90 L1200 160 L0 160 Z" fill="var(--brand)" opacity="0.10" />
        <path d="M0 120 C 250 80 450 160 700 120 S 1050 80 1200 115 L1200 160 L0 160 Z" fill="var(--brand)" opacity="0.14" />
      </svg>
    );
  }
  // dots
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--brand-text) 35%, transparent) 1.2px, transparent 0)',
        backgroundSize: '22px 22px',
        ...fade,
      }}
    />
  );
}

export function StoreHeader({ storeName, whatsapp, design: saved, hideEta = false }) {
  const design = useLiveDesign(saved);

  // No design: exactly the header every store has always had.
  if (!design) {
    return (
      <section className="border-b border-[color:var(--border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-6">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-bold text-[color:var(--ink-mute)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--success)]" />
            Open now
          </div>
          <h1 className="mt-3 text-[36px] sm:text-[52px] lg:text-[64px] leading-[0.95] font-black tracking-tight text-[color:var(--ink)] break-words">
            {storeName}
          </h1>
          <p className="mt-2 text-[14px] sm:text-[16px] text-[color:var(--ink-mute)]">Pick a bundle below. Pay by Mobile Money. Delivered in 1–5 min.</p>
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[color:var(--ink-mute)] hover:text-[color:var(--ink)]"
            >
              <MessageCircle className="w-4 h-4 text-[color:var(--success)]" /> WhatsApp us
            </a>
          )}
        </div>
      </section>
    );
  }

  const slim = design.heroStyle === 'minimal';
  const split = design.heroStyle === 'split' && !hideEta;
  const center = design.heroAlign === 'center' && !split;
  const headline = design.headline || '';
  const sub = design.subheadline || 'Pick a bundle below. Pay by Mobile Money. Delivered in 1–5 min.';
  const cta = design.ctaLabel || '';

  const text = (
    <div className={`min-w-0 ${center ? 'text-center' : ''}`}>
      <div className={`flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-bold text-[color:var(--ink-mute)] ${center ? 'justify-center' : ''}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--success)]" />
        Open now
      </div>
      <h1
        className={`mt-3 font-black tracking-tight text-[color:var(--ink)] break-words leading-[0.95] ${
          slim ? 'text-[28px] sm:text-[36px]' : 'text-[36px] sm:text-[52px] lg:text-[64px]'
        }`}
      >
        {storeName}
      </h1>
      {headline && (
        <p className={`mt-3 font-bold leading-snug text-[color:var(--brand-deep)] ${slim ? 'text-[16px] sm:text-[18px]' : 'text-[18px] sm:text-[22px]'}`}>{headline}</p>
      )}
      <p className="mt-2 text-[14px] sm:text-[16px] text-[color:var(--ink-mute)]">{sub}</p>
      {(cta || whatsapp) && (
        <div className={`mt-4 flex flex-wrap items-center gap-3 ${center ? 'justify-center' : ''}`}>
          {cta && (
            <a href="#bundles" className="btn btn-yellow">
              {cta} <ArrowDown className="w-4 h-4" />
            </a>
          )}
          {whatsapp && (
            <a
              href={`https://wa.me/${whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[color:var(--ink-mute)] hover:text-[color:var(--ink)]"
            >
              <MessageCircle className="w-4 h-4 text-[color:var(--success)]" /> WhatsApp us
            </a>
          )}
        </div>
      )}
    </div>
  );

  return (
    <section className="relative overflow-hidden border-b border-[color:var(--border)]">
      <HeroPattern kind={design.heroPattern} />
      <div
        className={`relative max-w-6xl mx-auto px-4 sm:px-6 ${slim ? 'pt-5 pb-4' : 'pt-8 pb-8 sm:pt-10 sm:pb-10'} ${
          split ? 'grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-center' : ''
        }`}
      >
        {text}
        {split && <DeliveryEtaBanner />}
      </div>
    </section>
  );
}
