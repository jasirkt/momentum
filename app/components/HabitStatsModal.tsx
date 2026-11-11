'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';
import { Habit, Schedule } from '../types';
import CalendarView from './CalendarView';
import ScheduleEditor from './ScheduleEditor';
import { calculateHabitStats } from '../utils/statsUtils';
import { getScheduleOn, schedulesEqual } from '../utils/scheduleUtils';
import { describeSchedule } from '../utils/scheduleText';
import { getLocalDateString } from '../utils/dateUtils';
import { MAX_HABIT_NAME_LENGTH } from '../utils/habitValidation';

type HabitStatsModalProps = {
  habit: Habit;
  onClose: () => void;
  onToggle: (habitId: number, date: string) => void;
  onChangeSchedule: (habitId: number, schedule: Schedule) => void;
  onRename: (habitId: number, name: string) => void;
};

export default function HabitStatsModal({ habit, onClose, onToggle, onChangeSchedule, onRename }: HabitStatsModalProps) {
  const stats = useMemo(() => calculateHabitStats(habit), [habit]);
  const currentSchedule = getScheduleOn(habit, getLocalDateString(new Date()));
  const [draft, setDraft] = useState<Schedule | null>(null);

  const saveSchedule = () => {
    if (draft && !schedulesEqual(draft, currentSchedule)) onChangeSchedule(habit.id, draft);
    setDraft(null);
  };
  const [nameDraft, setNameDraft] = useState<string | null>(null);

  const saveName = () => {
    const trimmed = (nameDraft ?? '').trim();
    if (!trimmed) return;
    if (trimmed !== habit.name) onRename(habit.id, trimmed);
    setNameDraft(null);
  };
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (nameDraft !== null) setNameDraft(null);
      else onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, nameDraft]);

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
            {nameDraft === null ? (
              <div className="flex min-w-0 flex-1 items-start gap-1 pr-2">
                <h2
                  id="modal-title"
                  className="min-w-0 break-words font-serif text-2xl font-bold text-[var(--foreground)]"
                >
                  {habit.name}
                </h2>
                <button
                  type="button"
                  onClick={() => setNameDraft(habit.name)}
                  aria-label={`Rename ${habit.name}`}
                  className="-mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--on-surface-variant)] transition-colors hover:bg-[var(--state-hover)] hover:text-[var(--foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                >
                  <Pencil size={18} />
                </button>
              </div>
            ) : (
              <form
                className="min-w-0 flex-1 pr-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  saveName();
                }}
              >
                <label id="modal-title" htmlFor="rename-input" className="sr-only">
                  Rename {habit.name}
                </label>
                <input
                  id="rename-input"
                  autoFocus
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  maxLength={MAX_HABIT_NAME_LENGTH}
                  className="w-full rounded-xl border border-[var(--outline)] bg-[var(--surface-container-lowest)] px-3 py-2 font-serif text-xl font-bold text-[var(--foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                />
                <div className="mt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setNameDraft(null)}
                    className="min-h-11 rounded-full px-4 text-sm font-semibold text-[var(--on-surface-variant)] hover:bg-[var(--state-hover)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!nameDraft.trim()}
                    className="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-[var(--on-primary)] hover:opacity-90 disabled:opacity-40"
                  >
                    Save
                  </button>
                </div>
              </form>
            )}
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

          <section aria-labelledby="schedule-heading" className="mt-6 rounded-2xl border border-[var(--outline-variant)] bg-[var(--surface-container-high)] p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 id="schedule-heading" className="text-[13px] font-semibold text-[var(--on-surface-variant)]">
                  Schedule
                </h3>
                <p className="text-[15px] font-semibold text-[var(--foreground)]">{describeSchedule(currentSchedule)}</p>
              </div>
              {!draft && (
                <button
                  type="button"
                  onClick={() => setDraft(currentSchedule)}
                  className="min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--state-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
                >
                  Change
                </button>
              )}
            </div>
            {draft && (
              <div className="mt-4 space-y-4">
                <ScheduleEditor value={draft} onChange={setDraft} />
                <p className="text-[13px] text-[var(--on-surface-variant)]">
                  Takes effect today. Past days keep the schedule they had.
                </p>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDraft(null)}
                    className="min-h-11 rounded-full px-4 text-sm font-semibold text-[var(--on-surface-variant)] hover:bg-[var(--state-hover)]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveSchedule}
                    className="min-h-11 rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-[var(--on-primary)] hover:opacity-90"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </section>

          <CalendarView habit={habit} onToggle={onToggle} />
        </div>
      </div>
    </div>
  );
}
