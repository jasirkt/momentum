export type Theme = 'light' | 'dark';

/** Explicit choice; absent means "follow the system". */
export const THEME_STORAGE_KEY = 'momentum_theme';

export const THEME_COLORS: Record<Theme, string> = {
  light: '#f6f1e7',
  dark: '#1c1915',
};

/**
 * Runs in <head> before first paint so the page never flashes the wrong theme.
 * Always sets data-theme to the resolved theme, which the CSS and the toggle glyph read.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var s=localStorage.getItem('${THEME_STORAGE_KEY}');var d=s==='dark'||(s!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light'}catch(e){}})()`;

export const getStoredTheme = (): Theme | null => {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
};

export const getSystemTheme = (): Theme =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';

export const applyTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute('content', THEME_COLORS[theme]);
  });
};
