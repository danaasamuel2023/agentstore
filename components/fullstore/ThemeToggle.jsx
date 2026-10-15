'use client';

/**
 * Light/dark theme switch.
 *
 * Reads the current theme off the `dark` class on <html> (set synchronously
 * by the boot script in app/layout.js so first paint matches the user's
 * stored preference). Clicking toggles the class and persists to
 * localStorage under `theme`. Other tabs stay in sync via the `storage`
 * event listener.
 */

import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

function readCurrentTheme() {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export function ThemeToggle({ className = '' }) {
  // Start as `null` to suppress the icon until the client has mounted —
  // avoids hydration mismatch when the server-rendered HTML doesn't know
  // the user's preference yet.
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    setTheme(readCurrentTheme());
    const onStorage = (e) => {
      if (e.key === 'theme') setTheme(readCurrentTheme());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.classList.toggle('dark', next === 'dark');
    try { localStorage.setItem('theme', next); } catch (_) {}
    setTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
      className={`relative w-9 h-9 rounded-full inline-flex items-center justify-center border border-[color:var(--border-strong)] hover:bg-[color:var(--surface-2)] transition-colors ${className}`}
    >
      {/* Render both icons but only show one. Avoids SSR hydration flash and
         keeps DOM stable for accessibility tools. */}
      <Sun
        className={`w-4 h-4 text-[color:var(--brand-deep)] transition-all ${
          theme === 'dark' ? 'opacity-0 -rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'
        } absolute`}
        aria-hidden="true"
      />
      <Moon
        className={`w-4 h-4 text-[color:var(--ink)] transition-all ${
          theme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-50'
        } absolute`}
        aria-hidden="true"
      />
    </button>
  );
}
