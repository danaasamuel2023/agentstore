'use client';

import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';

/**
 * The slim header at the top of a store's home page: name, the owner's own
 * headline and sub-line when their design has them, and WhatsApp.
 *
 * `design` is the saved design (or null — the header then reads exactly as it
 * always did). In the dashboard's live preview the draft arrives as a
 * 'dm-design-draft' event from DesignPreviewListener and replaces it.
 */
export function StoreHeader({ storeName, whatsapp, design: saved }) {
  const [design, setDesign] = useState(saved);
  useEffect(() => {
    const on = (e) => setDesign(e.detail || null);
    window.addEventListener('dm-design-draft', on);
    return () => window.removeEventListener('dm-design-draft', on);
  }, []);

  const center = design?.heroAlign === 'center';
  const headline = design?.headline || '';
  const sub = design?.subheadline || 'Pick a bundle below. Pay by Mobile Money. Delivered in 1–5 min.';

  return (
    <section className="border-b border-[color:var(--border)]">
      <div className={`max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-6 ${center ? 'text-center' : ''}`}>
        <div className={`flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] font-bold text-[color:var(--ink-mute)] ${center ? 'justify-center' : ''}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--success)]" />
          Open now
        </div>
        <h1 className="mt-3 text-[36px] sm:text-[52px] lg:text-[64px] leading-[0.95] font-black tracking-tight text-[color:var(--ink)] break-words">
          {storeName}
        </h1>
        {headline && (
          <p className="mt-3 text-[18px] sm:text-[22px] font-bold leading-snug text-[color:var(--brand-deep)]">{headline}</p>
        )}
        <p className="mt-2 text-[14px] sm:text-[16px] text-[color:var(--ink-mute)]">{sub}</p>
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
