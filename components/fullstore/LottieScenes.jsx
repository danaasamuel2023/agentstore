/**
 * Lottie-feel animated illustrations.
 *
 * These are pure SVG + CSS — no lottie-web dependency, no JSON files, no
 * external assets. The motion vocabulary is borrowed from Lottie though:
 * staggered fades, gentle bounces, slow rotations, soft pulses. They loop
 * forever at a low visual cost (~3-5 elements moving at ~6Hz).
 *
 * Used as fallbacks for the hero photo slots when /public/hero/*.jpg
 * doesn't exist. Drop real photos in and the static <img> covers these.
 *
 * Each scene is a self-contained illustration tuned for ~280-350px wide
 * portrait cards. Pass an aspectClass to match the parent's aspect.
 */

import { Banknote, Smartphone, TrendingUp } from 'lucide-react';

// ============================================================================
// CashScene — three cedi notes floating up + a spinning coin. Reads as
// "money in motion". Uses the brand yellow + green palette so it sits
// naturally inside the hero card.
// ============================================================================
export function CashScene({ className = '' }) {
  return (
    <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-emerald-400 via-emerald-500 to-green-700 ${className}`}>
      {/* Soft grid texture */}
      <div
        className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
          backgroundSize: '16px 16px'
        }}
      />

      <svg
        viewBox="0 0 200 240"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Back note */}
        <g className="lottie-float lottie-float-slow" style={{ transformOrigin: '100px 140px' }}>
          <rect x="46" y="118" width="108" height="58" rx="6" fill="#FBBF24" stroke="#92400E" strokeWidth="1.5" />
          <circle cx="100" cy="147" r="14" fill="#fef3c7" stroke="#92400E" strokeWidth="1.2" />
          <text x="100" y="153" textAnchor="middle" fontSize="14" fontWeight="900" fill="#92400E" fontFamily="ui-sans-serif">₵</text>
          <rect x="56" y="128" width="14" height="3" rx="1" fill="#92400E" opacity="0.4" />
          <rect x="56" y="160" width="14" height="3" rx="1" fill="#92400E" opacity="0.4" />
          <rect x="130" y="128" width="14" height="3" rx="1" fill="#92400E" opacity="0.4" />
          <rect x="130" y="160" width="14" height="3" rx="1" fill="#92400E" opacity="0.4" />
        </g>

        {/* Middle note */}
        <g className="lottie-float lottie-float-mid" style={{ transformOrigin: '100px 110px' }}>
          <rect x="40" y="88" width="120" height="62" rx="6" fill="#FCD34D" stroke="#92400E" strokeWidth="1.5" />
          <circle cx="100" cy="119" r="15" fill="#fffbeb" stroke="#92400E" strokeWidth="1.2" />
          <text x="100" y="125" textAnchor="middle" fontSize="15" fontWeight="900" fill="#92400E" fontFamily="ui-sans-serif">₵</text>
          <rect x="50" y="98" width="16" height="3" rx="1" fill="#92400E" opacity="0.4" />
          <rect x="50" y="134" width="16" height="3" rx="1" fill="#92400E" opacity="0.4" />
          <rect x="136" y="98" width="16" height="3" rx="1" fill="#92400E" opacity="0.4" />
          <rect x="136" y="134" width="16" height="3" rx="1" fill="#92400E" opacity="0.4" />
        </g>

        {/* Top note */}
        <g className="lottie-float lottie-float-fast" style={{ transformOrigin: '100px 78px' }}>
          <rect x="34" y="54" width="132" height="68" rx="6" fill="#FEF3C7" stroke="#92400E" strokeWidth="1.5" />
          <circle cx="100" cy="88" r="17" fill="#FBBF24" stroke="#92400E" strokeWidth="1.2" />
          <text x="100" y="95" textAnchor="middle" fontSize="18" fontWeight="900" fill="#92400E" fontFamily="ui-sans-serif">₵</text>
          <rect x="44" y="64" width="18" height="3" rx="1" fill="#92400E" opacity="0.5" />
          <rect x="44" y="104" width="18" height="3" rx="1" fill="#92400E" opacity="0.5" />
          <rect x="138" y="64" width="18" height="3" rx="1" fill="#92400E" opacity="0.5" />
          <rect x="138" y="104" width="18" height="3" rx="1" fill="#92400E" opacity="0.5" />
        </g>

        {/* Spinning coin */}
        <g className="lottie-spin" style={{ transformOrigin: '160px 30px' }}>
          <circle cx="160" cy="30" r="14" fill="#FBBF24" stroke="#92400E" strokeWidth="1.5" />
          <text x="160" y="36" textAnchor="middle" fontSize="14" fontWeight="900" fill="#92400E" fontFamily="ui-sans-serif">₵</text>
        </g>
        <g className="lottie-spin lottie-spin-delay" style={{ transformOrigin: '36px 200px' }}>
          <circle cx="36" cy="200" r="10" fill="#FBBF24" stroke="#92400E" strokeWidth="1.2" />
          <text x="36" y="204" textAnchor="middle" fontSize="10" fontWeight="900" fill="#92400E" fontFamily="ui-sans-serif">₵</text>
        </g>

        {/* Sparkle accents */}
        <g className="lottie-sparkle">
          <circle cx="20" cy="40" r="2" fill="#FEF3C7" />
        </g>
        <g className="lottie-sparkle lottie-sparkle-d1">
          <circle cx="180" cy="100" r="2.5" fill="#FEF3C7" />
        </g>
        <g className="lottie-sparkle lottie-sparkle-d2">
          <circle cx="14" cy="160" r="1.8" fill="#FEF3C7" />
        </g>
      </svg>

      {/* Tag at top */}
      <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-wider">
        <Banknote className="w-3 h-3" /> Cash out
      </div>
    </div>
  );
}

// ============================================================================
// ResellerScene — stylized person holding a phone, with a notification
// bubble that pops. Reads as "got an order / made a sale".
// ============================================================================
export function ResellerScene({ className = '' }) {
  return (
    <div className={`relative w-full h-full overflow-hidden bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 ${className}`}>
      <div
        className="absolute inset-0 opacity-15 mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.4) 1px, transparent 0)',
          backgroundSize: '14px 14px'
        }}
      />

      <svg
        viewBox="0 0 200 240"
        className="absolute inset-0 w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Body — shoulders */}
        <path
          d="M 30 240 Q 30 170 100 170 Q 170 170 170 240 Z"
          fill="#0F0E0B"
        />

        {/* Head — gentle bob */}
        <g className="lottie-bob" style={{ transformOrigin: '100px 110px' }}>
          {/* face */}
          <circle cx="100" cy="100" r="42" fill="#92400E" />
          {/* hair top */}
          <path
            d="M 60 78 Q 60 60 100 60 Q 140 60 140 78 Q 140 70 100 65 Q 60 70 60 78 Z"
            fill="#0F0E0B"
          />
          {/* left eye */}
          <ellipse cx="86" cy="100" rx="3.2" ry="4.2" fill="#0F0E0B" className="lottie-blink" />
          {/* right eye */}
          <ellipse cx="114" cy="100" rx="3.2" ry="4.2" fill="#0F0E0B" className="lottie-blink" />
          {/* smile */}
          <path
            d="M 86 120 Q 100 132 114 120"
            stroke="#0F0E0B"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* Phone in hand — gentle tilt */}
        <g className="lottie-tilt" style={{ transformOrigin: '155px 200px' }}>
          {/* phone body */}
          <rect x="140" y="170" width="36" height="56" rx="6" fill="#0F0E0B" />
          {/* phone screen */}
          <rect x="143" y="174" width="30" height="46" rx="3" fill="#FBBF24" />
          {/* screen line */}
          <rect x="148" y="182" width="20" height="2" rx="1" fill="#0F0E0B" opacity="0.5" />
          <rect x="148" y="188" width="14" height="2" rx="1" fill="#0F0E0B" opacity="0.5" />
          {/* success check */}
          <circle cx="158" cy="206" r="6" fill="#16A34A" />
          <path d="M 155 206 L 157 209 L 162 203" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </g>

        {/* Pop notification bubble above phone */}
        <g className="lottie-pop" style={{ transformOrigin: '160px 150px' }}>
          <circle cx="160" cy="150" r="14" fill="#16A34A" />
          <path d="M 154 150 L 158 154 L 167 145" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          {/* tail */}
          <circle cx="156" cy="166" r="3" fill="#16A34A" />
          <circle cx="154" cy="172" r="1.6" fill="#16A34A" />
        </g>

        {/* Sparkles around head */}
        <g className="lottie-sparkle">
          <path d="M 38 56 L 40 62 L 46 64 L 40 66 L 38 72 L 36 66 L 30 64 L 36 62 Z" fill="#FEF3C7" />
        </g>
        <g className="lottie-sparkle lottie-sparkle-d1">
          <path d="M 168 50 L 169 54 L 173 55 L 169 56 L 168 60 L 167 56 L 163 55 L 167 54 Z" fill="#FEF3C7" />
        </g>
      </svg>

      <div className="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-black/30 backdrop-blur-sm text-white text-[9px] font-black uppercase tracking-wider">
        <Smartphone className="w-3 h-3" /> Just sold
      </div>
    </div>
  );
}

// ============================================================================
// AvatarScene — small smiley avatar with subtle blink. Used in the
// testimonial cards when /public/hero/avatar-*.jpg doesn't exist.
// ============================================================================
export function AvatarScene({ gradient = 'from-yellow-300 to-amber-500', skin = '#92400E' }) {
  return (
    <div className={`w-full h-full bg-gradient-to-br ${gradient} flex items-center justify-center`}>
      <svg viewBox="0 0 48 48" className="w-full h-full" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <g className="lottie-bob" style={{ transformOrigin: '24px 26px' }}>
          {/* head */}
          <circle cx="24" cy="22" r="12" fill={skin} />
          {/* hair */}
          <path d="M 12 18 Q 12 12 24 12 Q 36 12 36 18 Q 36 14 24 14 Q 12 14 12 18 Z" fill="#0F0E0B" />
          {/* eyes */}
          <ellipse cx="19.5" cy="22" rx="1.1" ry="1.6" fill="#0F0E0B" className="lottie-blink" />
          <ellipse cx="28.5" cy="22" rx="1.1" ry="1.6" fill="#0F0E0B" className="lottie-blink" />
          {/* smile */}
          <path d="M 19.5 27 Q 24 31 28.5 27" stroke="#0F0E0B" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          {/* shoulders */}
          <path d="M 8 46 Q 8 36 24 36 Q 40 36 40 46 Z" fill="#0F0E0B" />
        </g>
      </svg>
    </div>
  );
}
