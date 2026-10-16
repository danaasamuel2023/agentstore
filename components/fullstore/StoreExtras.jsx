'use client';

/**
 * Two things a full store's owner can switch on, drawn on every shopping page
 * (never on /owner/*):
 *
 *  WhatsAppFloat     the round WhatsApp button in the corner — design.whatsappFloat
 *  StoreAnnouncement the owner's announcement, in the style picked in the
 *                    designer (customization.announcementPopupStyle):
 *                    banner · modal · slide · toast · none
 */

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { X, Info, Gift, AlertTriangle, CheckCircle, ExternalLink, MessageCircle } from 'lucide-react';
import { useLiveDesign } from '@/lib/fullstore/liveDesign';

const onOwnerPage = (pathname, storeSlug) =>
  typeof pathname === 'string' && /\/owner(\/|$)/.test(pathname.replace(`/${storeSlug}`, ''));

export function WhatsAppFloat({ storeSlug, whatsapp, design: saved }) {
  const design = useLiveDesign(saved);
  const pathname = usePathname();
  if (!whatsapp || !design?.whatsappFloat || onOwnerPage(pathname, storeSlug)) return null;
  return (
    <a
      href={`https://wa.me/${whatsapp}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105"
      style={{ background: '#25D366' }}
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}

/* ── announcement ──────────────────────────────────────────────────────── */

const ICONS = { info: Info, promo: Gift, warning: AlertTriangle, success: CheckCircle };
const TONE = {
  info: { fill: 'var(--brand)', on: 'var(--brand-ink, #000)' },
  promo: { fill: 'var(--brand)', on: 'var(--brand-ink, #000)' },
  warning: { fill: '#D97706', on: '#fff' },
  success: { fill: 'var(--success)', on: '#fff' },
};

const shownKey = (a) => `dm_announce_${String(a.title || '')}_${String(a.message || '')}`.slice(0, 80);

function isLive(a) {
  if (!a || a.enabled === false || !(a.message || a.title)) return false;
  const now = Date.now();
  if (a.startDate && new Date(a.startDate).getTime() > now) return false;
  if (a.endDate && new Date(a.endDate).getTime() < now) return false;
  if (a.showOnce) {
    try { if (sessionStorage.getItem(shownKey(a))) return false; } catch { /* storage blocked: show it */ }
  }
  return true;
}

/** A web link only (http/https) — anything else (javascript:, data:…) is not drawn. */
function safeLink(url) {
  try {
    const u = new URL(String(url || ''));
    return u.protocol === 'https:' || u.protocol === 'http:' ? u.toString() : null;
  } catch { return null; }
}

export function StoreAnnouncement({ storeSlug, announcement, style }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!style || style === 'none' || !isLive(announcement)) return undefined;
    if (style === 'banner') { setOpen(true); return undefined; }
    const t = setTimeout(() => setOpen(true), 600);
    return () => clearTimeout(t);
  }, [announcement, style]);

  if (!open || onOwnerPage(pathname, storeSlug)) return null;

  const a = announcement;
  const tone = TONE[a.type] || TONE.info;
  const Icon = ICONS[a.type] || Info;
  const link = safeLink(a.link);
  const close = () => {
    setOpen(false);
    if (a.showOnce) { try { sessionStorage.setItem(shownKey(a), '1'); } catch { /* ignore */ } }
  };
  const more = link && (
    <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-bold underline underline-offset-2">
      {a.linkText || 'Learn more'} <ExternalLink className="h-3.5 w-3.5" />
    </a>
  );

  if (style === 'banner') {
    return (
      <div style={{ background: tone.fill, color: tone.on }}>
        <div className="max-w-6xl mx-auto flex items-start gap-3 px-4 py-2.5 sm:px-6 text-[13.5px]">
          <Icon className="mt-0.5 h-4 w-4 flex-none" />
          <p className="flex-1">
            {a.title && <span className="font-bold">{a.title} </span>}
            <span className="opacity-90">{a.message}</span>{' '}{more}
          </p>
          <button type="button" onClick={close} aria-label="Close" className="flex-none opacity-80 hover:opacity-100"><X className="h-4 w-4" /></button>
        </div>
      </div>
    );
  }

  const panel = (
    <div className="card w-full max-w-md overflow-hidden shadow-2xl">
      <div className="flex items-center gap-2 px-5 py-3" style={{ background: tone.fill, color: tone.on }}>
        <Icon className="h-4 w-4" />
        <h3 className="flex-1 text-[15px] font-bold">{a.title || 'Announcement'}</h3>
        <button type="button" onClick={close} aria-label="Close" className="opacity-80 hover:opacity-100"><X className="h-4 w-4" /></button>
      </div>
      <div className="px-5 py-4 text-[14px] leading-relaxed text-[color:var(--ink)]">
        <p>{a.message}</p>
        {more && <p className="mt-3 text-[13.5px] text-[color:var(--brand-text,var(--ink))]">{more}</p>}
      </div>
    </div>
  );

  if (style === 'modal') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" onClick={close}>
        <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>{panel}</div>
      </div>
    );
  }
  // slide (bottom of the screen, full width on phones) · toast (corner, closes itself)
  return <Corner style={style} onClose={close}>{panel}</Corner>;
}

function Corner({ style, onClose, children }) {
  useEffect(() => {
    if (style !== 'toast') return undefined;
    const t = setTimeout(onClose, 9000);
    return () => clearTimeout(t);
  }, [style, onClose]);
  return (
    <div className={`fixed z-50 ${style === 'toast' ? 'bottom-5 left-5 right-5 sm:right-auto sm:w-96' : 'inset-x-0 bottom-0 flex justify-center px-3 pb-3'}`}>
      {children}
    </div>
  );
}
