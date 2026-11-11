'use client';

import { Schedule } from '../types';
import { HABIT_SUGGESTIONS } from '../utils/suggestions';
import { describeSchedule } from '../utils/scheduleText';

interface WelcomeEmptyStateProps {
  onAddHabit: (name: string, schedule: Schedule) => void;
}

export default function WelcomeEmptyState({ onAddHabit }: WelcomeEmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--outline)] p-6 text-center">
      <h2 className="font-serif text-xl font-bold text-[var(--foreground)]">Welcome to Momentum</h2>
      <p className="mt-2 text-sm text-[var(--on-surface-variant)]">
        Pick a few habits, tap the circle each day you do them, and watch your streaks grow. Your
        data stays on this device.
      </p>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.08em] text-[var(--on-surface-variant)]">
        Tap to add
      </p>
      <ul className="mt-2.5 flex flex-wrap justify-center gap-2">
        {HABIT_SUGGESTIONS.map(({ name, schedule }) => (
          <li key={name}>
            <button
              type="button"
              onClick={() => onAddHabit(name, schedule)}
              title={describeSchedule(schedule)}
              className="min-h-11 rounded-full border border-[var(--outline)] bg-[var(--surface-container-high)] px-4 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--state-hover)]"
            >
              + {name}
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-[var(--on-surface-variant)]">
        Or type your own below. Gym is set to Mon, Wed and Fri; you can change any schedule later.
      </p>
    </div>
  );
}
