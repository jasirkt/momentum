'use client';

import { Habit } from '../types';
import { getLocalDateString } from '../utils/dateUtils';
import { motion } from 'framer-motion';
import { Flame, Trash2, BarChart2, Check } from 'lucide-react';
import { calculateStreak } from '../utils/statsUtils';
import { useMemo } from 'react';

type HabitItemProps = {
  habit: Habit;
  dates: Date[];
  onToggle: (habitId: number, date: string) => void;
  onDelete: (habitId: number) => void;
  onOpenStats: (habitId: number) => void;
};

export default function HabitItem({ habit, dates, onToggle, onDelete, onOpenStats }: HabitItemProps) {
  const streak = useMemo(() => calculateStreak(habit), [habit]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="glass-panel group flex flex-col items-center justify-between gap-6 p-5 transition-[border-color,box-shadow] hover:border-[color-mix(in_srgb,var(--primary)_28%,var(--outline))] hover:shadow-[var(--elevation-2)] sm:flex-row"
    >
      <div className="w-full flex-1 text-center sm:w-auto sm:text-left">
        <h3 className="mb-1 text-lg font-semibold tracking-tight text-[var(--foreground)]">{habit.name}</h3>
        <div className="flex items-center justify-center gap-2 text-sm text-[var(--on-surface-variant)] sm:justify-start">
          <div
            className={`flex items-center gap-1.5 ${
              streak > 0 ? 'font-medium text-[var(--streak)]' : 'text-[var(--on-surface-variant)]'
            }`}
          >
            <Flame size={16} className={streak > 0 ? 'fill-[var(--streak)]' : ''} strokeWidth={2} />
            <span>{streak} day streak</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {dates.map((date) => {
          const dateStr = getLocalDateString(date);
          const isCompleted = habit.dates[dateStr] || false;
          const isToday = dateStr === getLocalDateString(new Date());

          return (
            <div key={dateStr} className="flex flex-col items-center gap-2">
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${
                  isToday ? 'text-[var(--primary)]' : 'text-[var(--on-surface-variant)]'
                }`}
              >
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => onToggle(habit.id, dateStr)}
                className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-2xl border transition-[background-color,border-color,box-shadow] ${
                  isCompleted
                    ? 'border-[color-mix(in_srgb,var(--primary)_45%,transparent)] bg-[var(--primary)] text-[var(--on-primary)] shadow-[var(--elevation-2)]'
                    : 'border-[var(--outline)] bg-[var(--surface-container-low)] hover:bg-[var(--state-hover)]'
                }`}
                aria-label={`${date.toDateString()} - ${isCompleted ? 'Completed' : 'Not completed'}`}
                type="button"
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    <Check size={20} strokeWidth={2.75} />
                  </motion.div>
                ) : (
                  <span
                    className={`text-sm font-semibold tabular-nums ${
                      isToday ? 'text-[var(--foreground)]' : 'text-[var(--on-surface-variant)]'
                    }`}
                  >
                    {date.getDate()}
                  </span>
                )}
              </motion.button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-1 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100">
        <button
          onClick={() => onOpenStats(habit.id)}
          className="rounded-xl p-2.5 text-[var(--on-surface-variant)] transition-colors hover:bg-[var(--state-hover)] hover:text-[var(--primary)]"
          aria-label="View statistics"
          type="button"
        >
          <BarChart2 size={20} strokeWidth={2} />
        </button>
        <button
          onClick={() => onDelete(habit.id)}
          className="rounded-xl p-2.5 text-[var(--on-surface-variant)] transition-colors hover:bg-[color-mix(in_srgb,#f87171_12%,transparent)] hover:text-red-300"
          aria-label="Delete habit"
          type="button"
        >
          <Trash2 size={20} strokeWidth={2} />
        </button>
      </div>
    </motion.div>
  );
}
