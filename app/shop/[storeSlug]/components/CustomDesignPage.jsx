'use client';

import { useEffect } from 'react';
import { useCustomDesign } from '@/lib/customDesignContext';

/**
 * One page of a store's shared custom design (home or /p/<page>).
 *
 * WHY dangerouslySetInnerHTML IS SAFE HERE: `page.html` is not user input. It
 * is produced by our own server-side block renderer (sitebuilder/blocks) from a
 * document that has been through sanitizeSite() — plain escaped text, an
 * allow-list of blocks/props/links, no scripts, no forms, no inline handlers —
 * the same markup we publish as the agent's static website after a final HTML
 * safety scan. The storefront never builds it from anything a visitor or an
 * owner types, and lib/customDesign.js only accepts it from our builder API.
 */
export default function CustomDesignPage({ design, page, preview = false }) {
  const { setPreviewCustom } = useCustomDesign();

  // In the editor's preview the layout can't see the draft by itself — hand it up.
  useEffect(() => {
    if (preview && design) setPreviewCustom(design);   // already the shell (no page HTML)
  }, [preview, design, setPreviewCustom]);

  if (!design || !page) return null;
  return (
    <div
      className="dm-site"
      style={design.vars}
      {...design.attrs}
      dangerouslySetInnerHTML={{ __html: page.html }}
    />
  );
}
