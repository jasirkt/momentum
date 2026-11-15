import { useEffect, useRef } from 'react';
import { APP_NAME } from './appInfo';

type BadgeNavigator = Navigator & {
  setAppBadge?: (count?: number) => Promise<void>;
  clearAppBadge?: () => Promise<void>;
};

const titleFor = (count: number) => (count > 0 ? `(${count}) ${APP_NAME}` : APP_NAME);

const applyBadge = (count: number) => {
  if (typeof document !== 'undefined' && document.title !== titleFor(count)) {
    document.title = titleFor(count);
  }
  if (typeof navigator === 'undefined') return;
  const nav = navigator as BadgeNavigator;
  try {
    const result =
      count > 0 ? nav.setAppBadge?.(count) : (nav.clearAppBadge?.() ?? nav.setAppBadge?.(0));
    result?.catch(() => {});
  } catch {
    // Unsupported or blocked: the badge is a nicety.
  }
};

/**
 * Shows `count` on the installed app's icon (Badging API) and in the browser tab title, clearing
 * both at 0. Pass null while the count is not known (before storage is read, or when it could not
 * be read) so a blank state never wipes the badge.
 * Does nothing where the Badging API is missing, and ignores rejections (e.g. notification
 * permission not granted on iOS). It re-applies when `refreshKey` changes and whenever the page
 * becomes visible, so permission granted elsewhere (such as iOS Settings) takes effect on return.
 * Next commits the metadata `<title>` after hydration, which overwrites a title set on mount, so
 * the title is put back whenever something else changes it.
 * The badge only updates while the app is running.
 */
export const useAppBadge = (count: number | null, refreshKey?: unknown): void => {
  const countRef = useRef(count);
  countRef.current = count;

  useEffect(() => {
    if (count !== null) applyBadge(count);
  }, [count, refreshKey]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const onVisible = () => {
      if (document.visibilityState === 'visible' && countRef.current !== null) {
        applyBadge(countRef.current);
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    const keepTitle = new MutationObserver(() => {
      const current = countRef.current;
      if (current !== null && document.title !== titleFor(current)) document.title = titleFor(current);
    });
    keepTitle.observe(document.head, { childList: true, subtree: true, characterData: true });

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      keepTitle.disconnect();
    };
  }, []);
};
