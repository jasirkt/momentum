'use client';

import { useMemo, useEffect, useRef } from 'react';
import { Habit } from '../types';
import CalendarView from './CalendarView';
import { calculateHabitStats } from '../utils/statsUtils';

type HabitStatsModalProps = {
  habit: Habit;
  onClose: () => void;
  onToggle: (habitId: number, date: string) => void;
};

export default function HabitStatsModal({ habit, onClose, onToggle }: HabitStatsModalProps) {
  const stats = useMemo(() => calculateHabitStats(habit), [habit]);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(43,38,32,0.45)] p-4"
      onClick={onClose}
    >
      <div
        className="mx-auto max-h-full w-full max-w-md overflow-y-auto rounded-3xl border border-[var(--outline)] bg-[var(--surface)] shadow-[var(--elevation-3)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="border-b border-[var(--outline-variant)] p-6">
          <div className="flex items-start justify-between">
            <h2
              id="modal-title"
              className="break-words pr-4 font-serif text-2xl font-bold text-[var(--foreground)]"
            >
              {habit.name}
            </h2>
            <button
              ref={closeRef}
              onClick={onClose}
              className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--on-surface-variant)] transition-colors hover:bg-[var(--state-hover)] hover:text-[var(--foreground)]"
              aria-label="close"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-[var(--foreground)]">{stats.total}</p>
              <p className="text-sm text-[var(--on-surface-variant)]">Total Completions</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[var(--success)]">{stats.currentStreak}</p>
              <p className="text-sm text-[var(--on-surface-variant)]">Current Streak</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-[var(--streak)]">{stats.longestStreak}</p>
              <p className="text-sm text-[var(--on-surface-variant)]">Longest Streak</p>
            </div>
          </div>

          <CalendarView habit={habit} onToggle={onToggle} />
        </div>
      </div>
    </div>
  );
}
