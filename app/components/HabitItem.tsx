'use client';

import { Habit } from '../types';
import { getLocalDateString } from '../utils/dateUtils';
import { motion } from 'framer-motion';
import { Check, MoreHorizontal, BarChart2, Archive, Trash2 } from 'lucide-react';
import { calculateHabitStats } from '../utils/statsUtils';
import { getDueInfo, getScheduleOn } from '../utils/scheduleUtils';
import { describeDue } from '../utils/scheduleText';
import { useEffect, useMemo, useRef, useState } from 'react';

type HabitItemProps = {
  habit: Habit;
  onToggle: (habitId: number, date: string) => void;
  onArchive: (habitId: number) => void;
  onDelete: (habitId: number) => void;
  onOpenStats: (habitId: number) => void;
};

export default function HabitItem({ habit, onToggle, onArchive, onDelete, onOpenStats }: HabitItemProps) {
  // Read on every render: the page re-renders when the day changes while the app stays open.
  const todayStr = getLocalDateString(new Date());
  const streak = useMemo(() => calculateHabitStats(habit, todayStr).currentStreak, [habit, todayStr]);
  const isDone = Boolean(habit.dates[todayStr]);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const schedule = getScheduleOn(habit, todayStr);
  const isDaily = schedule.type === 'daily';
  const dueInfo = useMemo(() => getDueInfo(habit, todayStr), [habit, todayStr]);
  const isOverdue = !isDone && dueInfo.status === 'overdue';

  // Daily streaks count days; other schedules count completions in a row, next to what is due.
  const streakNote = isDaily
    ? isDone
      ? streak > 0
        ? `${streak} day streak`
        : 'Done for today'
      : streak > 0
        ? `${streak} day streak, keep it going`
        : 'Start a streak today'
    : isDone
      ? streak > 0
        ? `${streak} in a row`
        : 'Done for today'
      : [streak > 0 ? `${streak} in a row` : null, describeDue(dueInfo, schedule, todayStr)]
          .filter(Boolean)
          .join(' · ');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`relative flex min-h-[60px] items-center gap-3 rounded-2xl border px-4 py-3 ${
        isDone
          ? 'border-[var(--success-outline)] bg-[var(--success-container)]'
          : 'border-[var(--outline-variant)] bg-[var(--surface-container)] shadow-[var(--elevation-1)]'
      }`}
    >
      <button
        type="button"
        // The day of the tap, not of the last render: a card left open overnight must not
        // toggle yesterday.
        onClick={() => onToggle(habit.id, getLocalDateString(new Date()))}
        aria-pressed={isDone}
        aria-label={isDone ? `Mark ${habit.name} not done today` : `Mark ${habit.name} done today`}
        className={`flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface)] ${
          isDone
            ? 'border-[var(--success)] bg-[var(--success)] text-[var(--on-success)]'
            : 'border-[var(--on-surface-variant)] text-transparent hover:bg-[var(--state-hover)] hover:text-[var(--on-surface-variant)]'
        }`}
      >
        <Check size={22} strokeWidth={3} />
      </button>

      <button
        type="button"
        onClick={() => onOpenStats(habit.id)}
        aria-label={`View statistics for ${habit.name}`}
        className="min-w-0 flex-1 rounded-lg py-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
      >
        <span
          className={`block break-words text-base font-semibold leading-tight ${
            isDone ? 'text-[var(--on-surface-variant)] line-through decoration-[var(--outline)]' : 'text-[var(--foreground)]'
          }`}
        >
          {habit.name}
        </span>
        <span
          className={`mt-0.5 block text-[13px] font-medium ${
            isOverdue
              ? 'text-[var(--danger)]'
              : streak > 0
                ? 'text-[var(--streak)]'
                : 'text-[var(--on-surface-variant)]'
          }`}
        >
          {streakNote}
        </span>
      </button>

      <div className="relative shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={`More options for ${habit.name}`}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          className="flex h-11 w-11 items-center justify-center rounded-full text-[var(--on-surface-variant)] transition-colors hover:bg-[var(--state-hover)] hover:text-[var(--foreground)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]"
        >
          <MoreHorizontal size={20} />
        </button>
        {menuOpen && (
          <div
            role="menu"
            className="absolute right-0 top-full z-20 mt-1 w-44 overflow-hidden rounded-xl border border-[var(--outline)] bg-[var(--surface-container-lowest)] py-1 shadow-[var(--elevation-3)]"
          >
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onOpenStats(habit.id);
              }}
              className="flex min-h-11 w-full items-center gap-3 px-4 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--state-hover)]"
            >
              <BarChart2 size={18} />
              Statistics
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onArchive(habit.id);
              }}
              className="flex min-h-11 w-full items-center gap-3 px-4 text-sm font-medium text-[var(--foreground)] hover:bg-[var(--state-hover)]"
            >
              <Archive size={18} />
              Archive
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                onDelete(habit.id);
              }}
              className="flex min-h-11 w-full items-center gap-3 px-4 text-sm font-medium text-[var(--danger)] hover:bg-[var(--danger-container)]"
            >
              <Trash2 size={18} />
              Delete
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
