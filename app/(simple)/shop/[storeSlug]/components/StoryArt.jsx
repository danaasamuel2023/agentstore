/**
 * Our own story set.
 *
 * Two scenes, drawn here rather than sourced. The stock illustration this
 * replaced was built around one fixed blue (#407BFF) on a white ground, so it
 * needed a white panel under it to survive on a coloured hero — and it still
 * clashed with a blue shop and fought a black one. It also carries an
 * attribution requirement we would be shipping to every store.
 *
 * These are built the way the rest of the site is:
 *
 *  - Every neutral shape is `currentColor` at some opacity. Drop a scene on the
 *    brand band and it inherits --brand-ink; drop it on paper and it inherits
 *    the text colour. One drawing, correct on any shop colour, in both themes,
 *    with no panel needed behind it.
 *  - The only fixed colours are the three network marks, because those belong
 *    to the networks. Each gets a ring in currentColor so it stays legible even
 *    when a shop's brand is close to its own colour — an AirtelTigo-blue node
 *    on a blue shop, say.
 *  - No gradients.
 */

const NETWORKS = [
  { label: 'MTN', hex: '#FFCC00', ink: '#101010', cx: 62, cy: 62 },
  { label: 'TC', hex: '#E11D2E', ink: '#FFFFFF', cx: 272, cy: 98 },
  { label: 'AT', hex: '#1E3A6B', ink: '#FFFFFF', cx: 96, cy: 222 },
];

/* Hub edge -> node edge, so the lines never poke out from under a node. */
const SPOKES = [
  'M122 104 L78 74',
  'M204 117 L251 104',
  'M134 168 L108 204',
];

/**
 * Connected — a shop at the centre, reaching all three networks.
 * Used in the hero.
 */
export function ConnectedArt({ className = '' }) {
  return (
    <svg
      viewBox="34 34 266 216"
      className={className}
      fill="none"
      role="img"
      aria-label="One shop, connected to every network"
    >
      {/* Orbit */}
      <circle
        cx="160"
        cy="130"
        r="70"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="4 7"
        opacity="0.28"
      />

      {SPOKES.map((d) => (
        <path key={d} d={d} stroke="currentColor" strokeWidth="1.5" opacity="0.3" />
      ))}

      {/* The shop itself */}
      <circle cx="160" cy="130" r="46" fill="currentColor" opacity="0.12" />
      <circle cx="160" cy="130" r="32" fill="currentColor" opacity="0.16" />

      {/* A phone at the middle of it, with bundles stacking on the screen */}
      <rect x="144" y="104" width="32" height="52" rx="6" fill="currentColor" opacity="0.95" />
      {/* Bundles on the screen, in the shop's own colour. Drawn in currentColor
          they were white-on-white and invisible — the screen is currentColor
          too. --brand reads against it the way a bundle tile does on the real
          page. */}
      <rect x="150" y="112" width="20" height="5" rx="2.5" fill="var(--brand)" opacity="0.9" />
      <rect x="150" y="122" width="14" height="5" rx="2.5" fill="var(--brand)" opacity="0.6" />
      <rect x="150" y="132" width="17" height="5" rx="2.5" fill="var(--brand)" opacity="0.35" />
      <rect x="150" y="142" width="10" height="4" rx="2" fill="var(--brand)" opacity="0.2" />

      {/* The three networks */}
      {NETWORKS.map((n) => (
        <g key={n.label}>
          <circle cx={n.cx} cy={n.cy} r="23" fill="currentColor" opacity="0.9" />
          <circle cx={n.cx} cy={n.cy} r="20" fill={n.hex} />
          <text
            x={n.cx}
            y={n.cy + 4}
            textAnchor="middle"
            fontFamily="inherit"
            fontSize="10"
            fontWeight="700"
            fill={n.ink}
          >
            {n.label}
          </text>
        </g>
      ))}

      {/* Signal in the gaps */}
      <circle cx="238" cy="196" r="4" fill="currentColor" opacity="0.22" />
      <circle cx="252" cy="214" r="2.5" fill="currentColor" opacity="0.16" />
      <circle cx="46" cy="150" r="3" fill="currentColor" opacity="0.2" />
      <circle cx="196" cy="42" r="2.5" fill="currentColor" opacity="0.18" />
    </svg>
  );
}

/**
 * Delivered — a bundle landing on a phone, signal going out.
 * Used on the About page.
 */
export function DeliveredArt({ className = '' }) {
  return (
    <svg
      viewBox="0 0 260 170"
      className={className}
      fill="none"
      role="img"
      aria-label="A data bundle arriving on a phone"
    >
      <rect
        x="18"
        y="26"
        width="80"
        height="118"
        rx="13"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.35"
      />
      <rect x="27" y="40" width="62" height="90" rx="7" fill="currentColor" opacity="0.06" />
      <rect x="49" y="32" width="18" height="3" rx="1.5" fill="currentColor" opacity="0.28" />

      {/* Bundles arriving. currentColor, not the brand — on the About page this
          sits on a --brand-soft panel, where a brand-filled bar would vanish. */}
      <rect x="35" y="50" width="46" height="15" rx="4" fill="currentColor" opacity="0.75" />
      <rect x="35" y="71" width="36" height="15" rx="4" fill="currentColor" opacity="0.45" />
      <rect x="35" y="92" width="42" height="15" rx="4" fill="currentColor" opacity="0.25" />
      <rect x="35" y="113" width="24" height="7" rx="3.5" fill="currentColor" opacity="0.14" />

      <path d="M112 62 A26 26 0 0 1 112 108" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      <path d="M112 47 A41 41 0 0 1 112 123" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.35" />
      <path d="M112 32 A56 56 0 0 1 112 138" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.16" />

      {NETWORKS.map((n, i) => {
        const pos = [
          { cx: 205, cy: 55 },
          { cx: 228, cy: 85 },
          { cx: 205, cy: 115 },
        ][i];
        return (
          <g key={n.label}>
            <circle cx={pos.cx} cy={pos.cy} r="15" fill="currentColor" opacity="0.9" />
            <circle cx={pos.cx} cy={pos.cy} r="13" fill={n.hex} />
          </g>
        );
      })}

      <circle cx="176" cy="70" r="2.5" fill="currentColor" opacity="0.25" />
      <circle cx="182" cy="85" r="2.5" fill="currentColor" opacity="0.18" />
      <circle cx="176" cy="100" r="2.5" fill="currentColor" opacity="0.25" />
    </svg>
  );
}

export default DeliveredArt;
