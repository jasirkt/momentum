'use client';

import { useState, useEffect, useMemo } from 'react';
import AddHabitForm from './components/AddHabitForm';
import HabitItem from './components/HabitItem';
import DataManagement from './components/DataManagement';
import HabitStatsModal from './components/HabitStatsModal';
import { Habit } from './types';
import { getPastDates } from './utils/dateUtils';
import { compressHabits, decompressHabits } from './utils/storageUtils';

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


  return (
    <main className="bg-gray-900 text-gray-100 min-h-screen">
      <div className="container mx-auto max-w-4xl p-4 sm:p-6 md:p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-white">Momentum</h1>
          <p className="text-gray-400 mt-2">
            Build habits. Track progress. Gain momentum.
          </p>
        </header>

        {isWarningVisible && (
          <div className="bg-yellow-900/30 border border-yellow-700/50 text-yellow-200 px-4 py-3 rounded-lg relative mb-6" role="alert">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <strong className="font-bold">Heads up!</strong>
                <span className="block sm:inline sm:ml-1">Your data is saved only in this browser. Export it regularly.</span>
              </div>
            </div>
            <button
              onClick={handleDismissWarning}
              className="absolute top-0 right-0 mt-2 mr-2 p-1 text-yellow-300 rounded-md hover:bg-yellow-500/20"
              aria-label="Dismiss warning"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}

        <AddHabitForm onAddHabit={addHabit} />

        <div className="space-y-4">
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
            <div className="bg-gray-800 text-center p-8 rounded-lg shadow-md">
              <p className="text-gray-400">No habits yet. Add one to get started!</p>
            </div>
          )}
        </div>

        <DataManagement habits={habits} onImport={handleImport} />
      </div>

      {viewingHabit && (
        <HabitStatsModal
          habit={viewingHabit}
          onClose={() => setViewingHabit(null)}
          onToggle={toggleHabitDate}
        />
      )}
    </main>
  );
}