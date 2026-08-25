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
import { ConnectedArt } from './StoryArt';
import { ArrowRight } from 'lucide-react';


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
  const tagline =
    store?.customization?.heroHeadline ||
    store?.storeDescription ||
    'Data bundles for every network, delivered straight to any number.';

  const slim = style === 'minimal';

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
      {/* Dot grid. Sits under the content and never over the text. */}
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

      <div
        className={`relative mx-auto max-w-6xl px-4 ${
          slim ? 'pb-10 pt-24 sm:pb-12 sm:pt-32' : 'pb-14 pt-24 sm:pb-20 sm:pt-36'
        }`}
      >
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_auto]">
          <div className="max-w-2xl">
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
              className="mt-4 max-w-lg text-[16px] leading-relaxed sm:text-[18px]"
              style={{ opacity: 0.8 }}
            >
              {tagline}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={`/shop/${storeSlug}/products`}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-[15px] font-semibold transition-transform hover:-translate-y-px"
                style={{ background: 'var(--brand-ink)', color: 'var(--brand)' }}
              >
                Buy data
                <ArrowRight className="h-4 w-4" />
              </Link>

            </div>
          </div>

          {!slim && (
            <div className="hidden justify-self-end lg:block">
              <HeroArt />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
