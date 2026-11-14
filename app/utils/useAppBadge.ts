import { useEffect } from 'react';

type BadgeNavigator = Navigator & {
  setAppBadge?: (count?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

/**
 * Shows `count` on the installed app's icon (Badging API), clearing it at 0. Pass null while the
 * count is not known yet (before storage is read) so a blank initial state never wipes the badge.
 * Does nothing where the API is missing, and ignores rejections (e.g. notification permission
 * not granted on iOS). The badge only updates while the app is running.
 */
export const useAppBadge = (count: number | null): void => {
  useEffect(() => {
    if (count === null || typeof navigator === 'undefined') return;
    const nav = navigator as BadgeNavigator;
    try {
      const result =
        count > 0 ? nav.setAppBadge?.(count) : (nav.clearAppBadge?.() ?? nav.setAppBadge?.(0));
      result?.catch(() => {});
    } catch {
      // Unsupported or blocked: the badge is a nicety.
    }
  }, [count]);
};
