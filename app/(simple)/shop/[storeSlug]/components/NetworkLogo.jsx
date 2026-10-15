/**
 * The network marks.
 *
 * These SVGs already existed — they were pasted into products/page.jsx, and
 * before the redesign into StorePageClient and PackageDisplay too, three copies
 * of the same three logos. One copy lives here now so a change to the MTN mark
 * cannot land on the products page and miss the home page.
 *
 * The artwork is unchanged from what was already shipping.
 */

export const MTNLogo = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" aria-hidden>
    <rect width="80" height="80" rx="16" fill="#FFCC00" />
    <ellipse cx="40" cy="40" rx="30" ry="20" stroke="#000" strokeWidth="3" fill="none" />
    <text
      x="40"
      y="46"
      textAnchor="middle"
      fontFamily="Arial Black, Arial, sans-serif"
      fontSize="14"
      fontWeight="900"
      fill="#000"
    >
      MTN
    </text>
  </svg>
);

export const TelecelLogo = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
    <circle cx="24" cy="24" r="22" fill="#DC2626" />
    <text
      x="24"
      y="30"
      textAnchor="middle"
      fontFamily="system-ui, sans-serif"
      fontWeight="bold"
      fontSize="18"
      fill="#fff"
    >
      T
    </text>
  </svg>
);

export const ATLogo = ({ size = 40 }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
    <circle cx="24" cy="24" r="22" fill="#1E3A6B" />
    <text
      x="24"
      y="30"
      textAnchor="middle"
      fontFamily="system-ui, sans-serif"
      fontWeight="bold"
      fontSize="14"
      fill="#fff"
    >
      AT
    </text>
  </svg>
);

const BY_NETWORK = {
  YELLO: MTNLogo,
  TELECEL: TelecelLogo,
  AT_PREMIUM: ATLogo,
};

/** Renders the mark for a network key, or nothing for one we do not know. */
export default function NetworkLogo({ network, size = 40 }) {
  const Logo = BY_NETWORK[network];
  return Logo ? <Logo size={size} /> : null;
}
