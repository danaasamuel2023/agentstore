'use client';

import { useEffect, useState } from 'react';

/**
 * Is the dark theme currently showing?
 *
 * StoreLayoutClient owns the dark-mode toggle and writes `.dark` onto <html>.
 * Anything that needs to know outside that component — the design editor's
 * live preview, mainly — reads it back from the DOM rather than having the flag
 * threaded down through props it does not otherwise care about.
 *
 * Starts false so server and first client render agree; the effect corrects it
 * before paint.
 */
export function useIsDark() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const read = () => setDark(root.classList.contains('dark'));

    read();
    const observer = new MutationObserver(read);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return dark;
}

export default useIsDark;
