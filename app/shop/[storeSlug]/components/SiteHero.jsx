'use client';

/**
 * SiteHero — the opening section of the shop's own website.
 *
 * Full-bleed in the owner's colour, with the nav sitting transparently on top
 * of it. A brand's hero that stops at a 1024px content column looks like a card
 * on someone else's page, which is the thing we are getting away from.
 *
 * It is genuinely full width rather than breaking out with the usual
 * `left-1/2 w-screen -translate-x-1/2` trick. That trick is off by half the
 * scrollbar width, because 100vw counts the scrollbar and the content column
 * does not — the hero sat ~8px left of everything below it. The layout renders
 * the home page without a container instead, so there is nothing to break out
 * of and nothing to mis-measure.
 *
 * The right-hand slot holds artwork from our own story set (components/
 * StoryArt), drawn in currentColor so it takes whatever colour the shop picked.
 * It previously held a "Cheapest today" card; those prices are one screen down
 * in Popular bundles and the delivery state it carried has its own banner under
 * the hero, so nothing was lost by the swap.
 *
 * The background texture is a dot grid, deliberately NOT a two-stop diagonal
 * gradient. That gradient is the single loudest tell of a generated page, and on
 * a pale brand colour it made the white text unreadable at one end.
 */

import Link from 'next/link';
import { sellsCheckers } from './SiteNav';
import { ConnectedArt } from './StoryArt';
import { ArrowRight, GraduationCap } from 'lucide-react';
import { useStoreDesign } from '@/lib/storeDesign';

/* Background textures, all drawn in the band's own ink so they suit any colour.
   'dots' is the original and stays byte-identical for legacy shops. */
function HeroPattern({ kind }) {
  if (kind === 'none') return null;
  if (kind === 'grid') {
    return (
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(color-mix(in srgb, var(--brand-ink) 22%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--brand-ink) 22%, transparent) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          opacity: 0.35,
          maskImage: 'radial-gradient(120% 90% at 15% 0%, #000 20%, transparent 75%)',
          WebkitMaskImage: 'radial-gradient(120% 90% at 15% 0%, #000 20%, transparent 75%)',
        }}
      />
    );
  }
  if (kind === 'waves') {
    return (
      <svg
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 w-full sm:h-56"
        viewBox="0 0 1200 220"
        preserveAspectRatio="none"
        fill="none"
        style={{ color: 'var(--brand-ink)', opacity: 0.16 }}
      >
        <path d="M0 120 C 200 60, 400 180, 600 120 S 1000 60, 1200 120" stroke="currentColor" strokeWidth="2" />
        <path d="M0 160 C 200 100, 400 220, 600 160 S 1000 100, 1200 160" stroke="currentColor" strokeWidth="2" />
        <path d="M0 80 C 200 20, 400 140, 600 80 S 1000 20, 1200 80" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage:
          'radial-gradient(color-mix(in srgb, var(--brand-ink) 26%, transparent) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
        opacity: 0.28,
        maskImage: 'radial-gradient(120% 90% at 15% 0%, #000 20%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(120% 90% at 15% 0%, #000 20%, transparent 75%)',
      }}
    />
  );
}


/**
 * Hero artwork — ours, so it takes the shop's colours.
 *
 * The stock illustration this replaced was fixed blue on white, so it needed a
 * white panel under it to survive on a coloured hero, and it still clashed with
 * a blue shop. ConnectedArt is drawn in currentColor, which here resolves to
 * --brand-ink, so it sits directly on the band and is correct on every shop
 * colour and in both themes. It also drops an attribution requirement we would
 * otherwise be shipping to every store.
 */
function HeroArt() {
  return (
    <ConnectedArt
      className="w-full max-w-sm"
      // Inherits --brand-ink from the band it sits on.
    />
  );
}

export default function SiteHero({ store, storeSlug, style = 'default' }) {
  const { design, legacy } = useStoreDesign();
  const fallbackTagline = 'Data bundles for every network, delivered straight to any number.';
  // Legacy shops keep the exact original expression (raw stored headline).
  const tagline = legacy
    ? store?.customization?.heroHeadline || store?.storeDescription || fallbackTagline
    : design.headline || store?.storeDescription || fallbackTagline;
  const subheadline = legacy ? '' : design.subheadline;
  const ctaLabel = (!legacy && design.ctaLabel) || 'Buy data';
  const pattern = legacy ? 'dots' : design.heroPattern;
  const center = !legacy && design.heroAlign === 'center';
  const compact = !legacy && design.density === 'compact';

  const slim = style === 'minimal';
  const pad = slim
    ? compact ? 'pb-8 pt-20 sm:pb-10 sm:pt-28' : 'pb-10 pt-24 sm:pb-12 sm:pt-32'
    : compact ? 'pb-10 pt-20 sm:pb-14 sm:pt-28' : 'pb-14 pt-24 sm:pb-20 sm:pt-36';

  return (
    <section
      id="site-hero"
      /* -mt cancels the nav height that `main` reserves, so the colour runs up
         behind the transparent bar. Dropping this (it went out with the old
         w-screen breakout) left the bar transparent over white page background
         with white text on it — the wordmark and links simply disappeared. */
      className="relative -mt-16 sm:-mt-[72px]"
      style={{ background: 'var(--brand)', color: 'var(--brand-ink)' }}
    >
      {/* Background texture. Sits under the content and never over the text. */}
      <HeroPattern kind={pattern} />

      <div className={`relative mx-auto max-w-6xl px-4 ${pad}`}>
        <div className={center ? 'grid items-center gap-10' : 'grid items-center gap-10 lg:grid-cols-[1.15fr_auto]'}>
          <div className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
            <h1
              className="tracking-[-0.035em]"
              style={{
                color: 'var(--brand-ink)',
                fontWeight: 750,
                lineHeight: 1.02,
                fontSize: slim ? 'clamp(30px,6vw,44px)' : 'clamp(38px,8.2vw,68px)',
              }}
            >
              {store?.storeName || 'Data shop'}
            </h1>

            <p
              className={`mt-4 max-w-lg text-[16px] leading-relaxed sm:text-[18px]${center ? ' mx-auto' : ''}`}
              style={{ opacity: 0.8 }}
            >
              {tagline}
            </p>

            {subheadline && (
              <p
                className={`mt-2 max-w-lg text-[14px] leading-relaxed sm:text-[15px]${center ? ' mx-auto' : ''}`}
                style={{ opacity: 0.68 }}
              >
                {subheadline}
              </p>
            )}

            <div className={`mt-8 flex flex-wrap items-center gap-3${center ? ' justify-center' : ''}`}>
              <Link
                href={`/shop/${storeSlug}/products`}
                className="dm-cta dm-cta-inv inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-[15px] font-semibold transition-transform hover:-translate-y-px"
                style={{ background: 'var(--brand-ink)', color: 'var(--brand)' }}
              >
                {ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>

              {/* Only for shops that actually sell them. Outlined rather than
                  solid so the hero keeps ONE primary action — two filled
                  buttons side by side make a visitor choose before they have
                  read anything. */}
              {sellsCheckers(store) && (
                <Link
                  href={`/shop/${storeSlug}/checkers`}
                  className="dm-cta inline-flex h-12 items-center justify-center gap-2 rounded-xl border px-6 text-[15px] font-semibold transition-transform hover:-translate-y-px"
                  style={{
                    borderColor: 'color-mix(in srgb, var(--brand-ink) 40%, transparent)',
                    color: 'var(--brand-ink)',
                  }}
                >
                  <GraduationCap className="h-4 w-4" />
                  Result checkers
                </Link>
              )}
            </div>
          </div>

          {!slim && !center && (
            <div className="hidden justify-self-end lg:block">
              <HeroArt />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
