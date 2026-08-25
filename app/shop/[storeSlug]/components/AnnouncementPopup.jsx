'use client';

/**
 * Announcement popup.
 *
 * Behaviour is unchanged — same four styles, same showOnce handling, same
 * auto-dismiss on the toast. What changed is where the colour comes from.
 *
 * Every variant used to hardcode Tailwind's palette (`bg-blue-500`,
 * `bg-purple-500`, `text-yellow-600`…), so a shop with a green brand still got
 * a bright blue modal over the top of it — the one element on the page that
 * ignored the owner entirely. Types now map onto the design tokens: `info` and
 * `promo` take the store's own brand colour, `warning` and `success` take the
 * status tokens they actually mean.
 */

import { useState, useEffect } from 'react';
import { X, Info, Gift, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';
import { shouldShowAnnouncement, markAnnouncementShown } from '@/lib/designCache';

const TYPE_ICONS = {
  info: Info,
  promo: Gift,
  warning: AlertTriangle,
  success: CheckCircle,
};

/* token: the solid fill. onToken: readable text on that fill.
   soft: the tinted background. line: the border for the tinted background. */
const TYPE_TOKENS = {
  info:    { solid: 'var(--brand)', on: 'var(--brand-ink)', soft: 'var(--brand-soft)', line: 'var(--brand-line)', text: 'var(--brand)' },
  promo:   { solid: 'var(--brand)', on: 'var(--brand-ink)', soft: 'var(--brand-soft)', line: 'var(--brand-line)', text: 'var(--brand)' },
  warning: { solid: 'var(--warn)',  on: '#ffffff',          soft: 'var(--warn-soft)',  line: 'var(--warn)',       text: 'var(--warn)' },
  success: { solid: 'var(--ok)',    on: '#ffffff',          soft: 'var(--ok-soft)',    line: 'var(--ok)',         text: 'var(--ok)' },
};

const tokensFor = (type) => TYPE_TOKENS[type] || TYPE_TOKENS.info;

function LearnMore({ announcement, colour, compact }) {
  if (!announcement.link) return null;
  return (
    <a
      href={announcement.link}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 font-medium hover:underline ${compact ? 'text-[12.5px]' : 'text-[13.5px]'}`}
      style={{ color: colour }}
    >
      {announcement.linkText || 'Learn more'}
      <ExternalLink className="h-3 w-3" />
    </a>
  );
}

/* -------------------------------------------------------------------------- */

const Banner = ({ announcement, onClose }) => {
  const t = tokensFor(announcement.type);
  const Icon = TYPE_ICONS[announcement.type] || Info;

  return (
    <div
      className="animate-slideDown px-4 py-2.5"
      style={{ background: t.solid, color: t.on }}
    >
      <div className="mx-auto flex max-w-5xl items-center gap-3">
        <Icon className="h-4 w-4 flex-none" />
        <p className="min-w-0 flex-1 text-[13px]">
          {announcement.title && <span className="font-semibold">{announcement.title} </span>}
          <span className="opacity-90">{announcement.message}</span>
        </p>
        {announcement.link && (
          <a
            href={announcement.link}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden whitespace-nowrap rounded-sm px-2.5 py-1 text-[12.5px] font-medium transition-opacity hover:opacity-80 sm:inline-flex sm:items-center sm:gap-1.5"
            style={{ background: 'rgba(255,255,255,.18)' }}
          >
            {announcement.linkText || 'Learn more'}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
        <button
          type="button"
          onClick={onClose}
          className="flex-none rounded-sm p-1 transition-opacity hover:opacity-70"
          aria-label="Dismiss announcement"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

const Modal = ({ announcement, onClose }) => {
  const t = tokensFor(announcement.type);
  const Icon = TYPE_ICONS[announcement.type] || Info;

  // Escape closes. A modal that can only be dismissed by finding the small X is
  // a modal people close by leaving the site.
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="animate-fadeIn fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" onClick={onClose} />

      <div
        className="animate-scaleIn relative w-full max-w-sm overflow-hidden rounded-lg bg-paper"
        style={{ boxShadow: 'var(--lift-3)' }}
      >
        <div className="flex items-start gap-3 border-b border-hairline p-5">
          <span
            className="flex h-8 w-8 flex-none items-center justify-center rounded-md"
            style={{ background: t.soft, color: t.text }}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1 pt-0.5">
            <h3 className="text-[15.5px]">{announcement.title || 'Announcement'}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 -mt-1 flex-none rounded-sm p-1.5 text-ink-4 transition-colors hover:text-ink"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 p-5">
          <p className="text-[14px] leading-relaxed text-ink-2">{announcement.message}</p>
          <LearnMore announcement={announcement} colour={t.text} />
        </div>

        <div className="border-t border-hairline p-4">
          <button type="button" onClick={onClose} className="btn btn-brand w-full">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

const Slide = ({ announcement, onClose }) => {
  const t = tokensFor(announcement.type);
  const Icon = TYPE_ICONS[announcement.type] || Info;

  return (
    <div className="animate-slideUp fixed bottom-4 left-4 right-4 z-[100] md:left-auto md:w-80">
      <div
        className="overflow-hidden rounded-lg border bg-paper"
        style={{ borderColor: t.line, boxShadow: 'var(--lift-2)' }}
      >
        <div className="flex items-start gap-3 p-4">
          <span
            className="flex h-8 w-8 flex-none items-center justify-center rounded-md"
            style={{ background: t.soft, color: t.text }}
          >
            <Icon className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1 space-y-1">
            {announcement.title && <h4 className="text-[13.5px]">{announcement.title}</h4>}
            <p className="text-[13px] leading-relaxed text-ink-3">{announcement.message}</p>
            <LearnMore announcement={announcement} colour={t.text} compact />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 -mt-1 flex-none rounded-sm p-1 text-ink-4 transition-colors hover:text-ink"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Toast = ({ announcement, onClose }) => {
  const t = tokensFor(announcement.type);
  const Icon = TYPE_ICONS[announcement.type] || Info;

  useEffect(() => {
    const timer = setTimeout(onClose, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="animate-slideInRight fixed right-4 top-20 z-[100]">
      <div
        className="max-w-xs overflow-hidden rounded-lg border border-hairline bg-paper"
        style={{ boxShadow: 'var(--lift-2)' }}
      >
        <div className="flex items-center gap-2.5 p-3.5">
          <span
            className="flex h-7 w-7 flex-none items-center justify-center rounded-md"
            style={{ background: t.soft, color: t.text }}
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
          <p className="min-w-0 flex-1 text-[13px] leading-snug text-ink-2">
            {announcement.title && <span className="font-semibold text-ink">{announcement.title}: </span>}
            {announcement.message}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="flex-none rounded-sm p-1 text-ink-4 transition-colors hover:text-ink"
            aria-label="Close"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="h-0.5 bg-sunken">
          <div className="animate-shrink h-full" style={{ background: t.solid, animationDuration: '8s' }} />
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */

export default function AnnouncementPopup({ announcement, style = 'banner' }) {
  const [visible, setVisible] = useState(false);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (!shouldShowAnnouncement(announcement)) return;

    // The banner is inline content, so showing it late would shove the page
    // down under the reader. Overlays float and can afford the delay.
    if (style === 'banner') {
      setVisible(true);
      return;
    }
    const timer = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(timer);
  }, [announcement, style]);

  const handleClose = () => {
    setVisible(false);
    setClosed(true);
    if (announcement?.showOnce) markAnnouncementShown(announcement);
  };

  if (!visible || closed || !announcement) return null;

  const Variant = { banner: Banner, modal: Modal, slide: Slide, toast: Toast }[style];
  if (!Variant) return null;

  return <Variant announcement={announcement} onClose={handleClose} />;
}
