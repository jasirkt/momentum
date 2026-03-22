'use client';

import { useState, useEffect, useMemo } from 'react';
import AddHabitForm from './components/AddHabitForm';
import HabitItem from './components/HabitItem';
import DataManagement from './components/DataManagement';
import HabitStatsModal from './components/HabitStatsModal';
import DailyProgress from './components/DailyProgress';
import { Habit } from './types';
import { getPastDates, getLocalDateString } from './utils/dateUtils';
import { compressHabits, decompressHabits } from './utils/storageUtils';
import { AnimatePresence, motion } from 'framer-motion';

const defaultHabits = (): Habit[] => [
  { id: Date.now() + 1, name: 'Drink 8 glasses of water', dates: {} },
  { id: Date.now() + 2, name: 'Move your body for 20 minutes', dates: {} },
  { id: Date.now() + 3, name: 'Read for 15 minutes', dates: {} },
];

export default function Home() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [storageHydrated, setStorageHydrated] = useState(false);
  const [storageLoadFailed, setStorageLoadFailed] = useState(false);
  const [viewingHabit, setViewingHabit] = useState<Habit | null>(null);
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const datesToShow = useMemo(() => getPastDates(7), []);

  // Effect to LOAD and MIGRATE data
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const warningClosed = localStorage.getItem('momentum_warning_closed');
    if (warningClosed !== 'true') setIsWarningVisible(true);

    const savedHabitsRaw = localStorage.getItem('habits');

    try {
      if (savedHabitsRaw) {
        const storedData: unknown = JSON.parse(savedHabitsRaw);
        if (!Array.isArray(storedData)) {
          throw new Error('Stored habits must be a JSON array');
        }
        if (storedData.length > 0) {
          const first = storedData[0] as Record<string, unknown>;
          if ('yearlyData' in first) {
            setHabits(decompressHabits(storedData));
          } else if ('dates' in first) {
            console.log('Old data format detected. Migrating to optimized storage...');
            setHabits(storedData as Habit[]);
          }
        }
      } else {
        setHabits(defaultHabits());
      }
    } catch (e) {
      console.warn('Failed to load habits from storage:', e);
      setStorageLoadFailed(true);
      setHabits(defaultHabits());
    } finally {
      setStorageHydrated(true);
    }
  }, []);

  // Effect to SAVE habits in the new optimized format (only after initial load completes)
  useEffect(() => {
    if (typeof window === 'undefined' || !storageHydrated) return;
    if (habits.length > 0 || localStorage.getItem('habits')) {
      const compressedData = compressHabits(habits);
      localStorage.setItem('habits', JSON.stringify(compressedData));
    }
  }, [habits, storageHydrated]);

  // --- UI HANDLERS & CRUD ---
  const handleDismissWarning = () => {
    setIsWarningVisible(false);
    localStorage.setItem('momentum_warning_closed', 'true');
  };

  const addHabit = (name: string) => {
    const newHabit: Habit = { id: Date.now(), name: name, dates: {} };
    setHabits([...habits, newHabit]);
  };

  const deleteHabit = (habitId: number) => {
    if (window.confirm('Are you sure? This cannot be undone.')) {
      setHabits(habits.filter((habit) => habit.id !== habitId));
    }
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

  const handleImport = (importedHabits: Habit[]) => {
    setHabits(importedHabits);
  };

  const completedToday = useMemo(() => {
    const todayStr = getLocalDateString(new Date());
    return habits.filter((h) => h.dates[todayStr]).length;
  }, [habits]);

  return (
    <main className="min-h-screen pb-20">
      <div className="container mx-auto max-w-2xl p-4 sm:p-6">
        <header className="mb-10 flex flex-col items-center">
          <h1 className="text-4xl font-bold tracking-tight text-[var(--foreground)] mb-2">
            Momentum
          </h1>
          <p className="text-[var(--on-surface-variant)] text-sm font-medium">
            Build habits. Track progress.
          </p>
          <div
            className="mt-3 h-1 w-16 rounded-full bg-[var(--primary)] opacity-90"
            aria-hidden
          />
        </header>

        {storageLoadFailed && (
          <div
            className="rounded-2xl border border-[var(--outline)] bg-[var(--surface-container-highest)] px-4 py-3 mb-6 text-sm text-[var(--foreground)] shadow-[var(--elevation-1)]"
            role="status"
          >
            Saved data could not be read; showing default habits. If this keeps happening, try
            exporting from a backup or clear site data for this app.
          </div>
        )}

        {isWarningVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border border-[var(--outline)] bg-[var(--surface-container-high)] text-[var(--foreground)] px-4 py-3 rounded-2xl relative mb-6 shadow-[var(--elevation-1)]"
          >
            <div className="flex items-center pr-8">
              <span className="mr-3 text-xl" aria-hidden>
                ⚠️
              </span>
              <div className="text-sm text-[color-mix(in_srgb,var(--foreground)_92%,transparent)]">
                <strong className="font-semibold text-[var(--foreground)]">Local storage only</strong>
                <span className="block sm:inline sm:ml-1 text-[var(--on-surface-variant)]">
                  Your data stays in this browser. Export regularly.
                </span>
              </div>
            </div>
            <button
              onClick={handleDismissWarning}
              className="absolute top-2 right-2 rounded-full p-1.5 text-[var(--on-surface-variant)] hover:bg-[var(--state-hover)] hover:text-[var(--foreground)] transition-colors"
              type="button"
            >
              ✕
            </button>
          </motion.div>
        )}

        <DailyProgress totalHabits={habits.length} completedHabits={completedToday} />

        <div className="mb-8">
          <AddHabitForm onAddHabit={addHabit} />
        </div>

        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {habits.length > 0 ? (
              habits.map((habit) => (
                <HabitItem
                  key={habit.id}
                  habit={habit}
                  dates={datesToShow}
                  onToggle={toggleHabitDate}
                  onDelete={deleteHabit}
                  onOpenStats={() => setViewingHabit(habit)}
                />
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-panel p-8 text-center"
              >
                <p className="text-[var(--on-surface-variant)]">
                  No habits yet. Add one to start your journey.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-12 opacity-50 hover:opacity-100 transition-opacity">
          <DataManagement habits={habits} onImport={handleImport} />
        </div>
      </div>

      <AnimatePresence>
        {viewingHabit && (
          <HabitStatsModal
            habit={viewingHabit}
            onClose={() => setViewingHabit(null)}
            onToggle={toggleHabitDate}
          />
        )}
      </AnimatePresence>
    </main>
  );
}
