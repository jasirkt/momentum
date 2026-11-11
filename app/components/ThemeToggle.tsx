'use client';

import { useEffect, useId, useState } from 'react';
import { applyTheme, getStoredTheme, getSystemTheme, THEME_STORAGE_KEY, type Theme } from '../utils/theme';

const RAY_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

/**
 * A small sun at the end of the date line that sets into a moon. Until the user taps it,
 * the theme follows the system setting.
 */
export default function ThemeToggle() {
  const maskId = useId();
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const initial = getStoredTheme() ?? getSystemTheme();
    setTheme(initial);
    applyTheme(initial);

    const media = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!media) return;
    const onSystemChange = (event: MediaQueryListEvent) => {
      if (getStoredTheme()) return;
      const next: Theme = event.matches ? 'dark' : 'light';
      setTheme(next);
      applyTheme(next);
    };
    media.addEventListener('change', onSystemChange);
    return () => media.removeEventListener('change', onSystemChange);
  }, []);

  const toggle = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage unavailable: the switch still applies for this visit.
    }

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion && typeof document.startViewTransition === 'function') {
      document.startViewTransition(() => applyTheme(next));
    } else {
      applyTheme(next);
    }
  };

  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className="theme-glyph -my-2 -mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--on-surface-variant)] transition-colors hover:bg-[var(--state-hover)] hover:text-[var(--foreground)] active:bg-[var(--state-pressed)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--primary)]"
    >
      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor">
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
          <rect width="24" height="24" fill="white" />
          <circle className="glyph-shadow" cx="12" cy="12" r="6" fill="black" />
        </mask>
        <g className="glyph-rays" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          {RAY_ANGLES.map((angle) => (
            <line key={angle} x1="12" y1="2.5" x2="12" y2="4.5" transform={`rotate(${angle} 12 12)`} />
          ))}
        </g>
        <g mask={`url(#${maskId})`}>
          <circle className="glyph-core" cx="12" cy="12" r="4.5" />
        </g>
      </svg>
    </button>
  );
}
