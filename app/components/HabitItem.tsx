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
      className="glass-panel p-5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-6 group hover:border-indigo-500/30 transition-colors"
    >
      <div className="flex-1 w-full sm:w-auto text-center sm:text-left">
        <h3 className="text-lg font-semibold text-white mb-1">
          {habit.name}
        </h3>
        <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-gray-400">
          <div className={`flex items-center gap-1 ${streak > 0 ? 'text-orange-400' : 'text-gray-500'}`}>
            <Flame size={16} className={streak > 0 ? 'fill-orange-400' : ''} />
            <span className="font-medium">{streak} day streak</span>
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
              <span className={`text-[10px] font-medium uppercase tracking-wider ${isToday ? 'text-indigo-400' : 'text-gray-500'}`}>
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onToggle(habit.id, dateStr)}
                className={`w-10 h-10 rounded-xl cursor-pointer flex items-center justify-center transition-all border
                  ${isCompleted
                    ? 'bg-indigo-500 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.4)]'
                    : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'}`}
                aria-label={`${date.toDateString()} - ${isCompleted ? 'Completed' : 'Not completed'}`}
              >
                {isCompleted ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Check size={20} className="text-white" strokeWidth={3} />
                  </motion.div>
                ) : (
                  <span className={`text-sm font-medium ${isToday ? 'text-gray-300' : 'text-gray-600'}`}>
                    {date.getDate()}
                  </span>
                )}
              </motion.button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onOpenStats(habit.id)}
          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-indigo-400 transition-colors"
          aria-label="View statistics"
        >
          <BarChart2 size={20} />
        </button>
        <button
          onClick={() => onDelete(habit.id)}
          className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors"
          aria-label="Delete habit"
        >
          <Trash2 size={20} />
        </button>
      </div>
    </motion.div>
  );
}

