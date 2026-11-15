'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';

type AppBadgeButtonProps = {
  onGranted?: () => void;
};

/** True when running as an installed app rather than in a browser tab. */
const isStandalone = (): boolean =>
  window.matchMedia?.('(display-mode: standalone)').matches === true ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/**
 * Quiet opt-in button in the header to request notification permission, which iOS/iPadOS
 * home-screen apps need before setAppBadge works. Shown only in an installed app (a browser tab
 * has no icon to badge) that supports both Notifications and the Badging API, and hidden once
 * permission is granted or denied.
 */
export default function AppBadgeButton({ onGranted }: AppBadgeButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      'setAppBadge' in navigator &&
      isStandalone() &&
      Notification.permission === 'default'
    ) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  const handleClick = async () => {
    try {
      const result = await Notification.requestPermission();
      setVisible(false);
      if (result === 'granted') {
        onGranted?.();
      }
    } catch {
      setVisible(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Enable app icon badge"
      title="Enable app icon badge"
      className="-my-2 inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--on-surface-variant)] transition-colors hover:bg-[var(--state-hover)] hover:text-[var(--foreground)] active:bg-[var(--state-pressed)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--primary)]"
    >
      <Bell size={15} aria-hidden="true" />
    </button>
  );
}
