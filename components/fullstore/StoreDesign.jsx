'use client';

/**
 * Live preview for the DataMart dashboard's store designer.
 *
 * The dashboard opens this store as /{slug}?designPreview=1 inside an iframe
 * and posts the unsaved draft:
 *   dashboard → shop   { type: 'dm-design-preview', design }
 *   shop → dashboard   { type: 'dm-design-ready' }            on mount
 * Messages are accepted only from the dashboard's own origins, and the draft
 * goes through sanitizeDesign() (inside designCss) before it is drawn. Nothing
 * is saved — closing the preview leaves the store as it was.
 *
 * Mounted by the store layout on every page; it does nothing at all unless
 * the page was opened with ?designPreview=1.
 */

import { useEffect } from 'react';
import { designCss, fontHref } from '@/lib/fullstore/storeDesign';
import { sanitizeDesign } from '@/lib/fullstore/designSpec';

const ORIGINS = (process.env.NEXT_PUBLIC_DESIGN_EDITOR_ORIGINS
  || 'http://localhost:3000,https://www.datamartgh.shop,https://datamartgh.shop,https://beta.datamartgh.shop,https://datamart-v2.vercel.app')
  .split(',').map((s) => s.trim().replace(/\/+$/, '')).filter((s) => /^https?:\/\/[a-z0-9.-]+(?::\d{1,5})?$/i.test(s));

export function DesignPreviewListener() {
  useEffect(() => {
    let on = false;
    try { on = new URLSearchParams(window.location.search).get('designPreview') === '1'; } catch { on = false; }
    if (!on || window.parent === window) return undefined;

    const apply = (raw) => {
      const design = sanitizeDesign(raw);
      let style = document.getElementById('dm-design-preview');
      if (!style) { style = document.createElement('style'); style.id = 'dm-design-preview'; document.head.appendChild(style); }
      style.textContent = designCss(design);
      // The saved design's own stylesheet must not fight the draft.
      const saved = document.getElementById('dm-design');
      if (saved) saved.media = 'not all';

      const href = fontHref(design.font);
      let link = document.getElementById('dm-design-font-preview');
      if (href) {
        if (!link) { link = document.createElement('link'); link.id = 'dm-design-font-preview'; link.rel = 'stylesheet'; document.head.appendChild(link); }
        if (link.href !== href) link.href = href;
      } else if (link) link.remove();

      document.documentElement.classList.toggle('dark', design.mode === 'dark');
      window.dispatchEvent(new CustomEvent('dm-design-draft', { detail: design }));
    };

    const onMessage = (e) => {
      if (!ORIGINS.includes(e.origin)) return;
      if (!e.data || e.data.type !== 'dm-design-preview') return;
      apply(e.data.design);
    };
    window.addEventListener('message', onMessage);
    // The parent decides who it trusts; the ready ping carries no data.
    window.parent.postMessage({ type: 'dm-design-ready' }, '*');
    return () => window.removeEventListener('message', onMessage);
  }, []);
  return null;
}
