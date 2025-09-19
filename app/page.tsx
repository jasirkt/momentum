'use client';

import { useState, useEffect } from 'react';
import AddHabitForm from './components/AddHabitForm';
import HabitItem from './components/HabitItem';
import DataManagement from './components/DataManagement';
import HabitStatsModal from './components/HabitStatsModal';

// --- TYPE DEFINITION ---
export type Habit = {
  id: number;
  name: string;
  dates: Record<string, boolean>; // object with date strings as keys
};

// --- DATE HELPER FUNCTION ---
const getPastDates = (numDays: number): Date[] => {
  const dates = [];
  for (let i = 0; i < numDays; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date);
  }
  return dates.reverse(); // Today on the far right
};


export default function Home() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [viewingHabit, setViewingHabit] = useState<Habit | null>(null);
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const datesToShow = getPastDates(7); // Get the last 7 days

  // Effect to LOAD habits from localStorage or set defaults
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check if the warning has been previously closed
      const warningClosed = localStorage.getItem('momentum_warning_closed');
      if (warningClosed !== 'true') {
        setIsWarningVisible(true);
      }
      
      const savedHabits = localStorage.getItem('habits');
      if (savedHabits) {
        setHabits(JSON.parse(savedHabits));
      } else {
        // If no habits are saved, create a few inspirational defaults
        const defaultHabits: Habit[] = [
          { id: Date.now() + 1, name: 'Drink 8 glasses of water', dates: {} },
          { id: Date.now() + 2, name: 'Move your body for 20 minutes', dates: {} },
          { id: Date.now() + 3, name: 'Read for 15 minutes', dates: {} },
        ];
        setHabits(defaultHabits);
      }
    }
  }, []);

  // Effect to SAVE habits to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // We check the length to ensure we don't save an empty array on the initial render
      // before the defaults have been loaded.
      if (habits.length > 0 || localStorage.getItem('habits')) {
        localStorage.setItem('habits', JSON.stringify(habits));
      }
    }
  }, [habits]);

  // --- HANDLER FOR DISMISSING WARNING ---
  const handleDismissWarning = () => {
    setIsWarningVisible(false);
    if (typeof window !== 'undefined') {
      localStorage.setItem('momentum_warning_closed', 'true');
    }
  };
  
  // --- CRUD FUNCTIONS ---

  const addHabit = (name: string) => {
    const newHabit: Habit = {
      id: Date.now(),
      name: name,
      dates: {},
    };
    setHabits([...habits, newHabit]);
  };

  const deleteHabit = (habitId: number) => {
    if (window.confirm("Are you sure you want to delete this habit? This action cannot be undone.")) {
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

    if (viewingHabit && viewingHabit.id === habitId) {
      const updatedViewingHabit = newHabits.find(h => h.id === habitId);
      if (updatedViewingHabit) {
        setViewingHabit(updatedViewingHabit);
      }
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
                  <span className="block sm:inline sm:ml-1">Your data is saved only in this browser. Export it regularly to prevent data loss.</span>
              </div>
            </div>
            <button
              onClick={handleDismissWarning}
              className="absolute top-0 right-0 mt-2 mr-2 p-1 text-yellow-300 rounded-md hover:bg-yellow-500/20 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              aria-label="Dismiss warning"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
          </div>
        )}

        <AddHabitForm onAddHabit={addHabit} />

        {/* Habit List */}
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

        <DataManagement habits={habits} onImport={handleImport}/>
      </div>
      
      {/* Statistics Modal */}
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

