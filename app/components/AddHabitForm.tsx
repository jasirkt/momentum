'use client';

import { useState, FormEvent } from 'react';

// Define the component's props, which is a function to call when a habit is added
type AddHabitFormProps = {
  onAddHabit: (name: string) => void;
};

export default function AddHabitForm({ onAddHabit }: AddHabitFormProps) {
  const [habitName, setHabitName] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault(); // Stop the page from reloading on form submission
    
    const trimmedName = habitName.trim();
    if (!trimmedName) {
      // Optional: Add some user feedback for empty input
      return; 
    }

    onAddHabit(trimmedName); // Call the function passed from the parent page
    setHabitName(''); // Clear the input field for the next entry
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-xl font-semibold mb-4 text-white">Add a New Habit</h2>
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={habitName}
          onChange={(e) => setHabitName(e.target.value)}
          placeholder="e.g., Go for a walk"
          className="flex-grow p-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white placeholder-gray-400 transition"
          aria-label="New habit name"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white font-semibold py-3 px-6 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition duration-150 disabled:opacity-50"
          disabled={!habitName.trim()}
        >
          Add Habit
        </button>
      </div>
    </form>
  );
}
