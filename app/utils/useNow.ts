import { useEffect, useState } from 'react';

const hourKey = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;

/** Milliseconds until just after the next local hour starts. */
const msUntilNextHour = (from: Date): number => {
  const next = new Date(from.getTime());
  next.setHours(from.getHours() + 1, 0, 1, 0);
  return Math.max(1000, next.getTime() - from.getTime());
};

/**
 * The current time, or null until mounted (so server and client markup match). The value is
 * replaced whenever the local hour changes, which re-renders the page when the day rolls over
 * or the greeting period ends. An installed PWA can stay open for days, and timers do not run
 * while it is in the background, so it also re-checks whenever the page becomes visible again.
 */
export const useNow = (): Date | null => {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      const current = new Date();
      setNow((prev) => (prev && hourKey(prev) === hourKey(current) ? prev : current));
      clearTimeout(timer);
      timer = setTimeout(refresh, msUntilNextHour(current));
    };
    refresh();

    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', refresh);
    window.addEventListener('pageshow', refresh);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('pageshow', refresh);
    };
  }, []);

  return now;
};
