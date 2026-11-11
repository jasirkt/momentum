'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import AddHabitForm from './components/AddHabitForm';
import HabitItem from './components/HabitItem';
import DataManagement from './components/DataManagement';
import HabitStatsModal from './components/HabitStatsModal';
import WelcomeEmptyState from './components/WelcomeEmptyState';
import WeekSummary from './components/WeekSummary';
import ArchivedHabits from './components/ArchivedHabits';
import { Habit, Schedule } from './types';
import { getPastDates, getLocalDateString } from './utils/dateUtils';
import { compressHabits } from './utils/storageUtils';
import { validateAndNormalizeImportedHabits, MAX_HABIT_NAME_LENGTH } from './utils/habitValidation';
import { getGreeting } from './utils/greeting';
import { getDueInfo, setSchedule } from './utils/scheduleUtils';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

const UNDO_WINDOW_MS = 6000;
const BACKUP_KEY = 'habits_backup_unreadable';
// Set once the user has had a habit, so deleting them all later doesn't bring the welcome back.
const ONBOARDED_KEY = 'momentum_onboarded';

export default function Home() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [storageHydrated, setStorageHydrated] = useState(false);
  const [storageLoadFailed, setStorageLoadFailed] = useState(false);
  const [viewingHabit, setViewingHabit] = useState<Habit | null>(null);
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [onboarded, setOnboarded] = useState(true);
  // Set after mount so server and client markup match.
  const [now, setNow] = useState<Date | null>(null);
  // Chosen once on mount so a random late-night greeting doesn't change on re-render.
  const [greeting, setGreeting] = useState<string | null>(null);
  const [lastDeleted, setLastDeleted] = useState<{ habit: Habit; index: number } | null>(null);
  // The empty list shown after a failed load. While `habits` is still this exact array the user
  // has changed nothing, so the save effect must not touch the unreadable stored value.
  const failedLoadHabits = useRef<Habit[] | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const datesToShow = useMemo(() => getPastDates(7), []);

  // Effect to LOAD and MIGRATE data
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mountedAt = new Date();
    setNow(mountedAt);
    setGreeting(getGreeting(mountedAt.getHours()));
    const warningClosed = localStorage.getItem('momentum_warning_closed');
    if (warningClosed !== 'true') setIsWarningVisible(true);

    const savedHabitsRaw = localStorage.getItem('habits');
    // Someone with saved data has already been through first run.
    setOnboarded(localStorage.getItem(ONBOARDED_KEY) === 'true' || savedHabitsRaw !== null);

    try {
      if (savedHabitsRaw) {
        const storedData: unknown = JSON.parse(savedHabitsRaw);
        if (!Array.isArray(storedData)) {
          throw new Error('Stored habits must be a JSON array');
        }
        // Same validation as file import: handles both formats and rejects malformed data.
        setHabits(validateAndNormalizeImportedHabits(storedData));
      } else {
        setHabits([]);
      }
    } catch (e) {
      console.warn('Failed to load habits from storage:', e);
      setStorageLoadFailed(true);
      try {
        // Keep a copy of the raw value so a later save cannot destroy it.
        if (savedHabitsRaw && localStorage.getItem(BACKUP_KEY) === null) {
          localStorage.setItem(BACKUP_KEY, savedHabitsRaw);
        }
      } catch (backupError) {
        console.warn('Failed to back up unreadable habits:', backupError);
      }
      const empty: Habit[] = [];
      failedLoadHabits.current = empty;
      setHabits(empty);
    } finally {
      setStorageHydrated(true);
    }
  }, []);

  // Effect to SAVE habits in the new optimized format (only after initial load completes)
  useEffect(() => {
    if (typeof window === 'undefined' || !storageHydrated) return;
    if (habits === failedLoadHabits.current) return;
    if (habits.length > 0 || localStorage.getItem('habits')) {
      const compressedData = compressHabits(habits);
      localStorage.setItem('habits', JSON.stringify(compressedData));
    }
  }, [habits, storageHydrated]);

  // Remember that the user has finished the welcome, separately from the habits themselves.
  const finishOnboarding = () => {
    setOnboarded(true);
    localStorage.setItem(ONBOARDED_KEY, 'true');
  };

  // --- UI HANDLERS & CRUD ---
  const handleDismissWarning = () => {
    setIsWarningVisible(false);
    localStorage.setItem('momentum_warning_closed', 'true');
  };

  const addHabit = (name: string, schedule?: Schedule) => {
    const newHabit: Habit = { id: Date.now(), name: name, dates: {} };
    if (schedule) {
      const schedules = setSchedule(newHabit, schedule, getLocalDateString(new Date()));
      if (schedules.length > 0) newHabit.schedules = schedules;
    }
    setHabits([...habits, newHabit]);
  };

  const changeHabitSchedule = (habitId: number, schedule: Schedule) => {
    const today = getLocalDateString(new Date());
    const newHabits = habits.map((habit) => {
      if (habit.id !== habitId) return habit;
      const updated: Habit = { ...habit };
      const schedules = setSchedule(habit, schedule, today);
      if (schedules.length > 0) updated.schedules = schedules;
      else delete updated.schedules;
      return updated;
    });
    setHabits(newHabits);
    if (viewingHabit?.id === habitId) {
      setViewingHabit(newHabits.find((h) => h.id === habitId) || null);
    }
  };

  const renameHabit = (habitId: number, name: string) => {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > MAX_HABIT_NAME_LENGTH) return;
    const newHabits = habits.map((habit) => (habit.id === habitId ? { ...habit, name: trimmed } : habit));
    setHabits(newHabits);
    if (viewingHabit?.id === habitId) {
      setViewingHabit(newHabits.find((h) => h.id === habitId) || null);
    }
  };

  useEffect(() => {
    return () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    };
  }, []);

  const deleteHabit = (habitId: number) => {
    const index = habits.findIndex((habit) => habit.id === habitId);
    if (index === -1) return;
    setLastDeleted({ habit: habits[index], index });
    setHabits(habits.filter((habit) => habit.id !== habitId));
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setLastDeleted(null), UNDO_WINDOW_MS);
  };

  const undoDelete = () => {
    if (!lastDeleted) return;
    const restored = [...habits];
    restored.splice(Math.min(lastDeleted.index, restored.length), 0, lastDeleted.habit);
    setHabits(restored);
    setLastDeleted(null);
    if (undoTimer.current) clearTimeout(undoTimer.current);
  };

  const setHabitArchived = (habitId: number, archived: boolean) => {
    setHabits(
      habits.map((habit) => {
        if (habit.id !== habitId) return habit;
        const updated: Habit = { ...habit };
        if (archived) updated.archived = true;
        else delete updated.archived;
        return updated;
      }),
    );
  };

  const toggleHabitDate = (habitId: number, date: string) => {
    const newHabits = habits.map((habit) => {
      if (habit.id === habitId) {
        const newDates = { ...habit.dates };
        if (newDates[date]) {
          delete newDates[date];
        } else {
          newDates[date] = true;
        }
        return { ...habit, dates: newDates };
      }
      return habit;
    });
    setHabits(newHabits);
    if (viewingHabit?.id === habitId) {
      setViewingHabit(newHabits.find((h) => h.id === habitId) || null);
    }
  };

  const downloadRawData = () => {
    const raw = localStorage.getItem(BACKUP_KEY) ?? localStorage.getItem('habits') ?? '';
    const url = URL.createObjectURL(new Blob([raw], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'momentum-unreadable-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const startFresh = () => {
    localStorage.removeItem('habits');
    localStorage.removeItem(BACKUP_KEY);
    failedLoadHabits.current = null;
    setStorageLoadFailed(false);
    setHabits([]);
  };

  const handleImport = (importedHabits: Habit[]) => {
    setStorageLoadFailed(false);
    setHabits(importedHabits);
  };

  // Archived habits keep their history but stay out of the daily list, due info and week summary.
  const activeHabits = useMemo(() => habits.filter((h) => !h.archived), [habits]);
  const archivedHabits = useMemo(() => habits.filter((h) => h.archived), [habits]);

  // To do: due or overdue today. Later: not due today (or this week's target is met). Done: done today.
  const { todo, later, done } = useMemo(() => {
    const todayStr = getLocalDateString(new Date());
    const groups = { todo: [] as Habit[], later: [] as Habit[], done: [] as Habit[] };
    for (const h of activeHabits) {
      if (h.dates[todayStr]) {
        groups.done.push(h);
      } else {
        const { status } = getDueInfo(h, todayStr);
        (status === 'due' || status === 'overdue' ? groups.todo : groups.later).push(h);
      }
    }
    return groups;
  }, [activeHabits]);

  const subtitle =
    habits.length === 0
      ? 'Add your first habit.'
      : activeHabits.length === 0
        ? 'No active habits.'
        : todo.length === 0
          ? done.length > 0
            ? 'All done today.'
            : 'Nothing due today.'
          : `${todo.length} left today.`;

  const renderHabit = (habit: Habit) => (
    <HabitItem
      key={habit.id}
      habit={habit}
      onToggle={toggleHabitDate}
      onArchive={(id) => setHabitArchived(id, true)}
      onDelete={deleteHabit}
      onOpenStats={() => setViewingHabit(habit)}
    />
  );

  return (
    <main className="min-h-screen pb-36">
      <div className="container mx-auto max-w-xl px-5 pt-14 sm:pt-16">
        <header className="mb-7">
          <p className="min-h-[1.25rem] text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--on-surface-variant)]">
            {now?.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <h1 className="mt-1.5 font-serif text-4xl font-bold leading-[1.1] tracking-tight text-[var(--foreground)]">
            {now && greeting ? (
              <>
                {greeting}
                <br />
                {subtitle}
              </>
            ) : (
              'Momentum'
            )}
          </h1>
        </header>

        {storageLoadFailed && (
          <div
            className="mb-6 rounded-2xl border border-[var(--outline)] bg-[var(--surface-container-high)] px-4 py-3 text-sm text-[var(--foreground)]"
            role="status"
          >
            <p>
              Saved data could not be read, so nothing is shown. Your original data is still stored
              and has not been changed until you add or change a habit (a copy is kept either way).
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={downloadRawData}
                className="min-h-11 rounded-full px-4 font-semibold underline-offset-2 hover:underline"
              >
                Download raw data
              </button>
              <button
                type="button"
                onClick={startFresh}
                className="min-h-11 rounded-full px-4 font-semibold text-[var(--danger)] underline-offset-2 hover:underline"
              >
                Start fresh
              </button>
            </div>
          </div>
        )}

        {/* Shown once there is something to lose, not as the first thing a newcomer reads. */}
        {isWarningVisible && habits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative mb-6 rounded-2xl border border-[var(--outline-variant)] bg-[var(--surface-container-high)] px-4 py-3 text-[var(--foreground)]"
          >
            <div className="pr-10 text-sm">
              <strong className="font-semibold">Local storage only.</strong>{' '}
              <span className="text-[var(--on-surface-variant)]">
                Your data stays in this browser. Export it from the bottom of the page now and then.
              </span>
            </div>
            <button
              onClick={handleDismissWarning}
              className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-full text-[var(--on-surface-variant)] transition-colors hover:bg-[var(--state-hover)] hover:text-[var(--foreground)]"
              type="button"
              aria-label="Dismiss"
            >
              <X size={18} />
            </button>
          </motion.div>
        )}

        <div className="space-y-7">
          {storageHydrated && !storageLoadFailed && !onboarded && (
            <WelcomeEmptyState
              onAddHabit={addHabit}
              addedNames={habits.map((h) => h.name)}
              onDone={finishOnboarding}
            />
          )}

          {storageHydrated && !storageLoadFailed && onboarded && habits.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[var(--outline)] p-8 text-center">
              <p className="text-[var(--on-surface-variant)]">
                No habits yet. Add one below to get started.
              </p>
            </div>
          )}

          {todo.length > 0 && (
            <section aria-labelledby="todo-heading">
              <h2
                id="todo-heading"
                className="mb-2.5 text-xs font-bold uppercase tracking-[0.08em] text-[var(--on-surface-variant)]"
              >
                To do
              </h2>
              <div className="space-y-2.5">
                <AnimatePresence mode="popLayout">{todo.map(renderHabit)}</AnimatePresence>
              </div>
            </section>
          )}

          {later.length > 0 && (
            <section aria-labelledby="later-heading">
              <h2
                id="later-heading"
                className="mb-2.5 text-xs font-bold uppercase tracking-[0.08em] text-[var(--on-surface-variant)]"
              >
                Not due today
              </h2>
              <div className="space-y-2.5">
                <AnimatePresence mode="popLayout">{later.map(renderHabit)}</AnimatePresence>
              </div>
            </section>
          )}

          {done.length > 0 && (
            <section aria-labelledby="done-heading">
              <h2
                id="done-heading"
                className="mb-2.5 text-xs font-bold uppercase tracking-[0.08em] text-[var(--on-surface-variant)]"
              >
                Done
              </h2>
              <div className="space-y-2.5">
                <AnimatePresence mode="popLayout">{done.map(renderHabit)}</AnimatePresence>
              </div>
            </section>
          )}

          <WeekSummary habits={activeHabits} dates={datesToShow} />
        </div>

        {/* Outside the spaced list so the quiet link sits close to the footer instead of floating. */}
        {archivedHabits.length > 0 && (
          <div className="mt-3">
            <ArchivedHabits
              habits={archivedHabits}
              onRestore={(id) => setHabitArchived(id, false)}
              onDelete={deleteHabit}
              onOpenStats={(id) => setViewingHabit(habits.find((h) => h.id === id) ?? null)}
            />
          </div>
        )}

        <div className={archivedHabits.length > 0 ? 'mt-5' : 'mt-12'}>
          <DataManagement habits={habits} onImport={handleImport} />
        </div>
      </div>

      {lastDeleted && (
        <div
          role="status"
          className="fixed inset-x-0 bottom-24 z-30 mx-auto flex w-[calc(100%-2.5rem)] max-w-md items-center gap-3 rounded-full bg-[var(--primary)] py-1.5 pl-5 pr-1.5 text-sm font-medium text-[var(--on-primary)] shadow-[var(--elevation-3)]"
        >
          <span className="min-w-0 flex-1 truncate">Deleted “{lastDeleted.habit.name}”</span>
          <button
            type="button"
            onClick={undoDelete}
            className="min-h-11 rounded-full px-4 font-bold underline-offset-2 hover:underline"
          >
            Undo
          </button>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--outline-variant)] bg-[var(--surface)] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto max-w-xl px-5">
          <AddHabitForm onAddHabit={addHabit} />
        </div>
      </div>

      <AnimatePresence>
        {viewingHabit && (
          <HabitStatsModal
            habit={viewingHabit}
            onClose={() => setViewingHabit(null)}
            onToggle={toggleHabitDate}
            onChangeSchedule={changeHabitSchedule}
            onRename={renameHabit}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
