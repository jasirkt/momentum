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
  const datesToShow = getPastDates(7); // Get the last 7 days

  // Effect to LOAD habits from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHabits = localStorage.getItem('habits');
      if (savedHabits) {
        setHabits(JSON.parse(savedHabits));
      }
    }
  }, []);

  // Effect to SAVE habits to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (habits.length > 0 || localStorage.getItem('habits')) {
        localStorage.setItem('habits', JSON.stringify(habits));
      }
    }
  }, [habits]);

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
    // Create the new habits array
    const newHabits = habits.map(habit => {
      if (habit.id === habitId) {
        const newDates = { ...habit.dates };
        newDates[date] = !newDates[date];
        return { ...habit, dates: newDates };
      }
      return habit;
    });

    // Update the master list of habits
    setHabits(newHabits);

    // **THE FIX:** If a habit is being viewed in the modal, find its updated
    // version in the new array and update the viewingHabit state as well.
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

