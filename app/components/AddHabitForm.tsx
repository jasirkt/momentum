'use client';

import { useState, FormEvent } from 'react';
import { Plus } from 'lucide-react';

type AddHabitFormProps = {
  onAddHabit: (name: string) => void;
};

export default function AddHabitForm({ onAddHabit }: AddHabitFormProps) {
  const [habitName, setHabitName] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const trimmedName = habitName.trim();
    if (!trimmedName) return;

    onAddHabit(trimmedName);
    setHabitName('');
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex gap-3">
        <input
          type="text"
          value={habitName}
          onChange={(e) => setHabitName(e.target.value)}
          placeholder="Add a new habit..."
          className="flex-grow p-4 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 focus:outline-none text-white placeholder-gray-500 transition-all backdrop-blur-sm"
          aria-label="New habit name"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white p-4 rounded-xl hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_25px_rgba(99,102,241,0.5)]"
          disabled={!habitName.trim()}
          aria-label="Add habit"
        >
          <Plus size={24} />
        </button>
      </div>
    </form>
  );
}
