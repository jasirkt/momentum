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
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={habitName}
        onChange={(e) => setHabitName(e.target.value)}
        maxLength={MAX_HABIT_NAME_LENGTH}
        placeholder="Add a new habit..."
        className="min-h-12 flex-grow rounded-full border border-[var(--outline)] bg-[var(--surface-container-lowest)] px-5 text-[15px] font-medium text-[var(--foreground)] transition-[box-shadow,border-color] placeholder:text-[var(--on-surface-variant)] focus:border-[var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--primary)_25%,transparent)]"
        aria-label="New habit name"
      />
      <button
        type="submit"
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--on-primary)] transition-[opacity,transform] hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        disabled={!habitName.trim()}
        aria-label="Add habit"
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>
    </form>
  );
}
