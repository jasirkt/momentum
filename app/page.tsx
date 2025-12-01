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

export default function Home() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [viewingHabit, setViewingHabit] = useState<Habit | null>(null);
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const datesToShow = useMemo(() => getPastDates(7), []);

  // Effect to LOAD and MIGRATE data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const warningClosed = localStorage.getItem('momentum_warning_closed');
      if (warningClosed !== 'true') setIsWarningVisible(true);

      const savedHabitsRaw = localStorage.getItem('habits');
      if (savedHabitsRaw) {
        const storedData = JSON.parse(savedHabitsRaw);
        if (storedData.length > 0) {
          // Check format by looking at the first habit's structure
          if ('yearlyData' in storedData[0]) {
            // New, optimized format. Decompress it for use in the app.
            setHabits(decompressHabits(storedData));
          } else if ('dates' in storedData[0]) {
            // Old, unoptimized JSON format. This is a migration case.
            console.log("Old data format detected. Migrating to optimized storage...");
            setHabits(storedData);
          }
        }
      } else {
        // No habits saved, create defaults.
        const defaultHabits: Habit[] = [
          { id: Date.now() + 1, name: 'Drink 8 glasses of water', dates: {} },
          { id: Date.now() + 2, name: 'Move your body for 20 minutes', dates: {} },
          { id: Date.now() + 3, name: 'Read for 15 minutes', dates: {} },
        ];
        setHabits(defaultHabits);
      }
    }
  }, []);

  // Effect to SAVE habits in the new optimized format
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (habits.length > 0 || localStorage.getItem('habits')) {
        // Always compress before saving
        const compressedData = compressHabits(habits);
        localStorage.setItem('habits', JSON.stringify(compressedData));
      }
    }
  }, [habits]);

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
    if (window.confirm("Are you sure? This cannot be undone.")) {
      setHabits(habits.filter(habit => habit.id !== habitId));
    }
  };

  const toggleHabitDate = (habitId: number, date: string) => {
    const newHabits = habits.map(habit => {
      if (habit.id === habitId) {
        const newDates = { ...habit.dates };
        newDates[date] = !newDates[date];
        return { ...habit, dates: newDates };
      }
      return habit;
    });
    setHabits(newHabits);
    if (viewingHabit?.id === habitId) {
      setViewingHabit(newHabits.find(h => h.id === habitId) || null);
    }
  };

  const handleImport = (importedHabits: Habit[]) => {
    setHabits(importedHabits);
  };

  const completedToday = useMemo(() => {
    const todayStr = getLocalDateString(new Date());
    return habits.filter(h => h.dates[todayStr]).length;
  }, [habits]);

  return (
    <main className="min-h-screen pb-20">
      <div className="container mx-auto max-w-2xl p-4 sm:p-6">
        <header className="mb-8 flex flex-col items-center">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400 mb-2">
            Momentum
          </h1>
          <p className="text-gray-400 text-sm">
            Build habits. Track progress.
          </p>
        </header>

        {isWarningVisible && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-yellow-900/20 border border-yellow-700/30 text-yellow-200 px-4 py-3 rounded-xl relative mb-6 backdrop-blur-sm"
          >
            <div className="flex items-center">
              <span className="mr-3 text-xl">⚠️</span>
              <div className="text-sm">
                <strong className="font-semibold">Local Storage Only:</strong>
                <span className="block sm:inline sm:ml-1">Your data is saved in this browser. Export regularly.</span>
              </div>
            </div>
            <button
              onClick={handleDismissWarning}
              className="absolute top-2 right-2 p-1 text-yellow-500 hover:text-yellow-300 transition-colors"
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
          <AnimatePresence mode='popLayout'>
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
                className="glass-panel p-8 rounded-xl text-center"
              >
                <p className="text-gray-400">No habits yet. Add one to start your journey!</p>
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