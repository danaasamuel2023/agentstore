/**
 * Result-checker art.
 *
 * Drawn here, in the same rules as StoryArt:
 *
 *  - Every neutral shape is `currentColor` at some opacity, so a scene inherits
 *    whatever it is dropped onto — paper, the brand band, either theme — with
 *    no white panel behind it.
 *  - The one saturated colour is the shop's own `var(--brand)`, used for the
 *    parts the eye should land on: the scratch panel and the checkmark.
 *  - No gradients.
 *
 * Deliberately NOT the WAEC or BECE logo. Those are the examinations councils'
 * marks; putting a facsimile on tens of thousands of shopfronts would be
 * passing off their identity, and a shop does not need it — a card with a
 * scratch panel and a PIN reads as "result checker" on sight.
 */

/**
 * CheckerCardArt — a checker card, mid-scratch: serial printed along the top,
 * the silver panel half rubbed away, the PIN showing through.
 *
 * The page's whole promise is "you get a serial and a PIN", so the drawing is
 * that, rather than a mortarboard or a stack of books.
 */
export function CheckerCardArt({ className = '' }) {
  return (
    <svg viewBox="0 0 320 200" className={className} role="img"
         aria-label="A result checker card showing a serial number and a scratch panel hiding the PIN">
      {/* card body */}
      <rect x="26" y="30" width="230" height="140" rx="14"
            fill="currentColor" fillOpacity="0.05"
            stroke="currentColor" strokeOpacity="0.22" strokeWidth="2" />

      {/* header rule — where a shop's own name would sit on a printed card */}
      <rect x="46" y="52" width="86" height="9" rx="4.5" fill="currentColor" fillOpacity="0.28" />
      <rect x="46" y="68" width="52" height="7" rx="3.5" fill="currentColor" fillOpacity="0.16" />

      {/* serial: label, then the digits as ticks so it reads as a number
          without ever showing a real-looking one */}
      <rect x="46" y="94" width="34" height="6" rx="3" fill="currentColor" fillOpacity="0.3" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect key={i} x={46 + i * 14} y="106" width="9" height="12" rx="2"
              fill="currentColor" fillOpacity="0.22" />
      ))}

      {/* scratch panel, half removed — the brand colour, because this is the
          part that matters */}
      <rect x="46" y="130" width="122" height="26" rx="6" fill="var(--brand)" fillOpacity="0.16" />
      <rect x="46" y="130" width="64" height="26" rx="6" fill="var(--brand)" />
      {/* scratch curls coming off the removed half */}
      <path d="M112 132 q7 5 2 11 q-5 6 3 11" fill="none"
            stroke="var(--brand)" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
      <path d="M120 136 q6 4 1 9" fill="none"
            stroke="var(--brand)" strokeOpacity="0.32" strokeWidth="2" strokeLinecap="round" />
      {/* the PIN, revealed */}
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={124 + i * 12} cy="143" r="3.2" fill="currentColor" fillOpacity="0.5" />
      ))}

      {/* perforated stub, so it reads as a card torn from a sheet */}
      <line x1="196" y1="42" x2="196" y2="158" stroke="currentColor" strokeOpacity="0.18"
            strokeWidth="2" strokeDasharray="5 7" strokeLinecap="round" />
      <rect x="212" y="66" width="28" height="6" rx="3" fill="currentColor" fillOpacity="0.2" />
      <rect x="212" y="80" width="20" height="6" rx="3" fill="currentColor" fillOpacity="0.14" />
      <rect x="212" y="118" width="28" height="28" rx="6"
            fill="currentColor" fillOpacity="0.08"
            stroke="currentColor" strokeOpacity="0.18" strokeWidth="1.5" />

      {/* delivered tick, riding the corner */}
      <circle cx="264" cy="52" r="22" fill="var(--brand)" />
      <path d="M254 52 l7 7 l13 -14" fill="none" stroke="var(--brand-ink)"
            strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * ResultSlipArt — a results slip with grades filled in. Used where the page
 * needs to say what the card is FOR, not what it looks like.
 */
export function ResultSlipArt({ className = '' }) {
  return (
    <svg viewBox="0 0 220 200" className={className} role="img"
         aria-label="A results slip with grades">
      <rect x="30" y="18" width="152" height="164" rx="12"
            fill="currentColor" fillOpacity="0.05"
            stroke="currentColor" strokeOpacity="0.22" strokeWidth="2" />

      {/* heading */}
      <rect x="50" y="40" width="70" height="8" rx="4" fill="currentColor" fillOpacity="0.28" />
      <line x1="50" y1="60" x2="162" y2="60" stroke="currentColor" strokeOpacity="0.14" strokeWidth="2" />

      {/* subject rows: name on the left, grade chip on the right */}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x="50" y={74 + i * 20} width={62 - (i % 3) * 12} height="7" rx="3.5"
                fill="currentColor" fillOpacity="0.18" />
          <rect x="138" y={71 + i * 20} width="24" height="13" rx="4"
                fill={i < 2 ? 'var(--brand)' : 'currentColor'}
                fillOpacity={i < 2 ? 1 : 0.16} />
        </g>
      ))}
    </svg>
  );
}
