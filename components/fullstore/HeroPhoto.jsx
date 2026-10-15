'use client';

/**
 * Photo slots for the hero + testimonials sections.
 *
 * <HeroPhoto src="/hero/cash.jpg" scene="cash" aspect="aspect-[4/5]" />
 *
 * Real flow:
 *   - Drop a real photo at /public/hero/cash.jpg → the img loads and
 *     covers the scene. Crisp, human, branded.
 *   - No photo present → onError hides the img and an animated SVG
 *     "Lottie-feel" scene plays in its place (CashScene, ResellerScene,
 *     AvatarScene). Looks intentional, not broken.
 *
 * Why pure SVG+CSS instead of lottie-web: the scenes here are small,
 * brand-controlled, and don't need parametric animations. Skipping the
 * lottie runtime saves ~80KB of JS on first paint and avoids managing
 * .json animation files for every storefront.
 */

import { useState } from 'react';
import { User } from 'lucide-react';
import { CashScene, ResellerScene, AvatarScene } from '@/components/fullstore/LottieScenes';

// Set NEXT_PUBLIC_HERO_PHOTOS=true once real photos are dropped at /public/hero/*.jpg.
// Until then, skip the <img> attempts so the console stays clean — the SVG scenes
// already carry the page, no 404s logged.
const HERO_PHOTOS_READY = process.env.NEXT_PUBLIC_HERO_PHOTOS === 'true';

function pickScene(scene) {
  switch (scene) {
    case 'cash':     return CashScene;
    case 'reseller': return ResellerScene;
    default:         return null;
  }
}

export function HeroPhoto({
  src,
  alt = '',
  scene,
  aspect = 'aspect-[3/4]'
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const Scene = pickScene(scene);

  return (
    <div className={`relative ${aspect} overflow-hidden bg-[color:var(--surface-2)]`}>
      {/* Animated scene fills the slot until a real photo loads on top. */}
      {!loaded && Scene && <Scene className="absolute inset-0" />}

      {/* Real photo — fades in when it loads, hides on error. */}
      {HERO_PHOTOS_READY && !errored && src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
        />
      )}

      {/* Bottom-fade for any text overlays sitting on the photo */}
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />
    </div>
  );
}

/**
 * Round avatar — animated face scene by default, real photo when present.
 */
export function AvatarPhoto({ src, initials = '', gradient = 'from-yellow-300 to-amber-500', skin = '#92400E', size = 48 }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  return (
    <div
      className="relative rounded-full overflow-hidden flex-shrink-0 ring-2 ring-[color:var(--surface)]"
      style={{ width: size, height: size }}
    >
      {/* Animated face fallback */}
      {!loaded && <AvatarScene gradient={gradient} skin={skin} />}

      {/* Real photo on top when it loads */}
      {HERO_PHOTOS_READY && !errored && src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={initials}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
        />
      )}
    </div>
  );
}
