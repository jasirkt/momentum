import { Habit } from '../types';
import { getLocalDateString } from '../utils/dateUtils';

type WeekSummaryProps = {
  habits: Habit[];
  /** The last seven days, oldest first, today last. */
  dates: Date[];
};

export default function WeekSummary({ habits, dates }: WeekSummaryProps) {
  if (habits.length === 0) return null;

  const days = dates.map((date) => {
    const key = getLocalDateString(date);
    return {
      key,
      label: date.toLocaleDateString('en-US', { weekday: 'long' }),
      count: habits.filter((h) => h.dates[key]).length,
    };
  });
  const done = days.reduce((sum, d) => sum + d.count, 0);
  const possible = habits.length * days.length;

  return (
    <section
      aria-label="This week"
      className="flex items-center gap-3 rounded-2xl border border-[var(--outline-variant)] bg-[var(--surface-container)] px-4 py-3.5 shadow-[var(--elevation-1)]"
    >
      <div className="flex-1">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.08em] text-[var(--on-surface-variant)]">
          This week
        </h2>
        <p className="mt-0.5 text-[15px] font-semibold text-[var(--foreground)]">
          {done} of {possible} check-ins
        </p>
      </div>
      <ul className="flex h-9 items-end gap-1.5" aria-hidden>
        {days.map((d, i) => (
          <li
            key={d.key}
            title={`${d.label}: ${d.count} of ${habits.length}`}
            className={`w-3.5 rounded-[4px] ${
              i === days.length - 1 ? 'bg-[var(--success)]' : 'bg-[var(--outline)]'
            }`}
            style={{ height: `${Math.max(4, Math.round((d.count / habits.length) * 36))}px` }}
          />
        ))}
      </ul>
    </section>
  );
}
