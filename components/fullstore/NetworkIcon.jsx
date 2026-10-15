/**
 * Hand-drawn-ish network logos as inline SVG. Not the official brand marks
 * (we never use those without permission) — these are stylised tokens that
 * read clearly at any size and don't require image assets.
 */
export function NetworkIcon({ network, size = 40 }) {
  const map = {
    YELLO: MTN,
    MTN: MTN,
    TELECEL: Telecel,
    AT_PREMIUM: AirtelTigo,
    at: AirtelTigo,
    airteltigo: AirtelTigo
  };
  const Comp = map[network] || Generic;
  return <Comp size={size} />;
}

function MTN({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-label="MTN">
      <rect width="64" height="64" rx="14" fill="#FFCC00" />
      <ellipse cx="32" cy="32" rx="22" ry="14" fill="none" stroke="#000" strokeWidth="2.4" />
      <text x="32" y="37" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontSize="13" fontWeight="900" fill="#000">MTN</text>
    </svg>
  );
}

function Telecel({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-label="Telecel">
      <rect width="64" height="64" rx="14" fill="#fff" stroke="#EEE" strokeWidth="1" />
      <circle cx="32" cy="32" r="22" fill="#E30613" />
      <text x="32" y="40" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="700" fill="#fff">t</text>
    </svg>
  );
}

function AirtelTigo({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-label="AirtelTigo">
      <defs>
        <linearGradient id="atGrad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#E60026" />
          <stop offset="1" stopColor="#0066B3" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#atGrad)" />
      <text x="32" y="40" textAnchor="middle" fontFamily="Arial Black, Arial, sans-serif" fontSize="22" fontWeight="900" fill="#fff">AT</text>
    </svg>
  );
}

function Generic({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-label="Network">
      <rect width="64" height="64" rx="14" fill="#1F2937" />
      <text x="32" y="40" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="900" fill="#FBBF24">?</text>
    </svg>
  );
}
