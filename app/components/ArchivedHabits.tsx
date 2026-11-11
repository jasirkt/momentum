'use client';

import { useState } from 'react';
import { ArchiveRestore, ChevronDown, Trash2 } from 'lucide-react';
import { Habit } from '../types';

type ArchivedHabitsProps = {
  habits: Habit[];
  onRestore: (habitId: number) => void;
  onDelete: (habitId: number) => void;
  onOpenStats: (habitId: number) => void;
};

/** Collapsed list of archived habits, each with its history intact and a way to bring it back. */
export default function ArchivedHabits({ habits, onRestore, onDelete, onOpenStats }: ArchivedHabitsProps) {
  const [open, setOpen] = useState(false);
  if (habits.length === 0) return null;

  return (
    <section aria-labelledby="archived-heading">
      <h2 id="archived-heading" className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--on-surface-variant)]">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="archived-list"
          className="flex min-h-11 w-full items-center gap-2 rounded-lg text-left uppercase focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        >
          Archived ({habits.length})
          <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </h2>
      {open && (
        <ul id="archived-list" className="mt-1 space-y-2.5">
          {habits.map((habit) => (
            <li
              key={habit.id}
              className="flex min-h-[60px] items-center gap-1 rounded-2xl border border-[var(--outline-variant)] bg-[var(--surface-container)] py-2 pl-4 pr-2"
            >
              <button
                type="button"
                onClick={() => onOpenStats(habit.id)}
                aria-label={`View statistics for ${habit.name}`}
                className="min-w-0 flex-1 rounded-lg py-1 text-left text-base font-semibold leading-tight text-[var(--on-surface-variant)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              >
                <span className="block break-words">{habit.name}</span>
              </button>
              <button
                type="button"
                onClick={() => onRestore(habit.id)}
                aria-label={`Restore ${habit.name}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--on-surface-variant)] transition-colors hover:bg-[var(--state-hover)] hover:text-[var(--foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              >
                <ArchiveRestore size={20} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(habit.id)}
                aria-label={`Delete ${habit.name}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--danger)] transition-colors hover:bg-[var(--danger-container)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              >
                <Trash2 size={20} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
