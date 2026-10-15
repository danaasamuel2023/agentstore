/**
 * DataBundle brand mark.
 *
 * <Logo /> renders just the icon — a black rounded square with stacked
 * brand-yellow data bars (reads as both a stylized "B" and a "bundle"
 * of data stacked together).
 *
 * <Logo wordmark /> pairs the mark with the "DataBundle" wordmark,
 * sized to sit at the same optical height as the icon — use this in
 * the top nav and footer where there's room.
 *
 * The mark is pure SVG so it stays crisp at any size and the colours
 * follow the design tokens (--ink for the body, brand yellow for the
 * bars). No external icon assets, no PNG fallbacks.
 */

export function Logo({ size = 32, wordmark = false, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark size={size} />
      {wordmark && (
        <span className="font-black text-[color:var(--ink)] tracking-tight leading-none">
          <span className="text-[color:var(--ink)]">Data</span>
          <span className="text-[color:var(--brand-deep)]">Bundle</span>
        </span>
      )}
    </span>
  );
}

export function LogoMark({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="DataBundle"
    >
      {/* Locked dark container — same in light + dark mode so the brand mark
         reads as "the logo" regardless of theme. */}
      <rect width="40" height="40" rx="10" fill="#0F0E0B" />

      {/* Back card — outlined yellow, offset to the lower-left so it peeks
         out behind the front card. Reads as the "underlying" bundle. */}
      <rect
        x="7"
        y="14"
        width="19"
        height="19"
        rx="4"
        fill="none"
        stroke="#FBBF24"
        strokeWidth="2.4"
      />

      {/* Front card — filled, offset to the upper-right. Sits on top of
         the back card, creating the "stacked bundles" motif. */}
      <rect x="14" y="7" width="19" height="19" rx="4" fill="#FBBF24" />
    </svg>
  );
}
