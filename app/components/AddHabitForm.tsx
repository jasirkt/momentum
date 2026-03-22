'use client';

import { useState, FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { MAX_HABIT_NAME_LENGTH } from '../utils/habitValidation';

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
          maxLength={MAX_HABIT_NAME_LENGTH}
          placeholder="Add a new habit..."
          className="min-h-14 flex-grow rounded-2xl border border-[var(--outline)] bg-[var(--surface-container-low)] px-4 py-3.5 text-[var(--foreground)] shadow-[var(--elevation-1)] transition-[box-shadow,border-color] placeholder:text-[var(--on-surface-variant)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_35%,transparent)]"
          aria-label="New habit name"
        />
        <button
          type="submit"
          className="flex min-h-14 min-w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--primary)] text-[var(--on-primary)] shadow-[var(--elevation-2)] transition-[transform,box-shadow,background-color] hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-offset-2 focus:ring-offset-[var(--surface)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          disabled={!habitName.trim()}
          aria-label="Add habit"
        >
          <Plus size={24} strokeWidth={2.25} />
        </button>
      </div>
    </form>
  );
}
