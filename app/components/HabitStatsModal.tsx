'use client';

import { useMemo } from 'react';
import { Habit } from '../types';
import CalendarView from './CalendarView';
import { calculateHabitStats } from '../utils/statsUtils';

type HabitStatsModalProps = {
  habit: Habit;
  onClose: () => void;
  onToggle: (habitId: number, date: string) => void;
};

export default function HabitStatsModal({ habit, onClose, onToggle }: HabitStatsModalProps) {
  const stats = useMemo(() => calculateHabitStats(habit), [habit]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center p-4 z-50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md mx-auto border border-gray-700"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-start">
            <h2 id="modal-title" className="text-2xl font-bold text-white pr-4 break-words">{habit.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="close"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-indigo-400">{stats.total}</p>
              <p className="text-sm text-gray-400">Total Completions</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-green-400">{stats.currentStreak}</p>
              <p className="text-sm text-gray-400">Current Streak</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-400">{stats.longestStreak}</p>
              <p className="text-sm text-gray-400">Longest Streak</p>
            </div>
          </div>

          <CalendarView habit={habit} onToggle={onToggle} />
        </div>
      </div>
    </div>
  );
}

