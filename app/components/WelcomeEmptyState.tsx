'use client';

import { Schedule } from '../types';
import { HABIT_SUGGESTIONS } from '../utils/suggestions';
import { describeSchedule } from '../utils/scheduleText';

interface WelcomeEmptyStateProps {
  onAddHabit: (name: string, schedule: Schedule) => void;
  /** Names of habits that already exist; their chips show as added. */
  addedNames: string[];
  /** Closes the welcome for good. */
  onDone: () => void;
}

export default function WelcomeEmptyState({ onAddHabit, addedNames, onDone }: WelcomeEmptyStateProps) {
  const added = new Set(addedNames.map((name) => name.trim().toLowerCase()));
  const hasHabits = addedNames.length > 0;

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
        {HABIT_SUGGESTIONS.map(({ name, schedule }) => {
          const isAdded = added.has(name.toLowerCase());
          return (
            <li key={name}>
              <button
                type="button"
                disabled={isAdded}
                onClick={() => onAddHabit(name, schedule)}
                title={describeSchedule(schedule)}
                className="min-h-11 rounded-full border border-[var(--outline)] bg-[var(--surface-container-high)] px-4 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--state-hover)] disabled:opacity-60 disabled:hover:bg-[var(--surface-container-high)]"
              >
                {isAdded ? `✓ ${name}` : `+ ${name}`}
                {schedule.type !== 'daily' && (
                  // Decorative: keeps the button's accessible name as just the habit.
                  <span aria-hidden="true" className="ml-1.5 font-normal text-[var(--on-surface-variant)]">
                    {describeSchedule(schedule)}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-xs text-[var(--on-surface-variant)]">
        Or type your own below. Suggestions with a schedule shown can be changed any time.
      </p>
      <button
        type="button"
        onClick={onDone}
        className="mt-3 min-h-11 rounded-full bg-[var(--primary)] px-6 text-sm font-semibold text-[var(--on-primary)]"
      >
        {hasHabits ? 'Done' : 'Skip'}
      </button>
    </div>
  );
}
