'use client';

/**
 * The store's design as a client component should draw it: the saved design
 * (already cleaned by savedDesign() on the server, or null), replaced by the
 * unsaved draft while the dashboard's live preview is open — the draft arrives
 * as a 'dm-design-draft' event from DesignPreviewListener.
 */

import { useEffect, useState } from 'react';

export function useLiveDesign(saved) {
  const [design, setDesign] = useState(saved || null);
  useEffect(() => {
    const on = (e) => setDesign(e.detail || null);
    window.addEventListener('dm-design-draft', on);
    return () => window.removeEventListener('dm-design-draft', on);
  }, []);
  return design;
}

/** Ids of the home-page sections the owner switched on, in their order. */
export function sectionsOn(design) {
  return (design?.sections || []).filter((s) => s.on).map((s) => s.id);
}
