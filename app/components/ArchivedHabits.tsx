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
      {/* Deliberately quiet: housekeeping, not part of the daily list. */}
      <h2 id="archived-heading" className="text-[13px] font-medium text-[var(--on-surface-variant)]">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="archived-list"
          className="flex min-h-11 items-center gap-1 rounded-lg opacity-80 transition-opacity hover:opacity-100 focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        >
          Archived ({habits.length})
          <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </h2>
      {open && (
        <ul id="archived-list" className="divide-y divide-[var(--outline-variant)] opacity-80">
          {habits.map((habit) => (
            <li key={habit.id} className="flex min-h-11 items-center gap-1">
              <button
                type="button"
                onClick={() => onOpenStats(habit.id)}
                aria-label={`View statistics for ${habit.name}`}
                className="min-w-0 flex-1 rounded-lg py-2 text-left text-sm leading-tight text-[var(--on-surface-variant)] hover:text-[var(--foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              >
                <span className="block break-words">{habit.name}</span>
              </button>
              <button
                type="button"
                onClick={() => onRestore(habit.id)}
                aria-label={`Restore ${habit.name}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--on-surface-variant)] transition-colors hover:bg-[var(--state-hover)] hover:text-[var(--foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              >
                <ArchiveRestore size={16} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(habit.id)}
                aria-label={`Delete ${habit.name}`}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[var(--on-surface-variant)] transition-colors hover:bg-[var(--danger-container)] hover:text-[var(--danger)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
