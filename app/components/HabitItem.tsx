'use client';

import { Habit } from '../types';
import { getLocalDateString } from '../utils/dateUtils';

type HabitItemProps = {
  habit: Habit;
  dates: Date[];
  onToggle: (habitId: number, date: string) => void;
  onDelete: (habitId: number) => void;
  onOpenStats: (habitId: number) => void;
};

export default function HabitItem({ habit, dates, onToggle, onDelete, onOpenStats }: HabitItemProps) {
  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
      <h3 className="text-lg font-semibold text-gray-200 w-full sm:w-auto sm:flex-1 text-center sm:text-left break-words">
        {habit.name}
      </h3>

      <div className="flex items-center gap-2">
        {dates.map((date) => {
          const dateStr = getLocalDateString(date);
          const isCompleted = habit.dates[dateStr] || false;

          return (
            <div key={dateStr} className="flex flex-col items-center gap-1">
              <span className="text-xs text-gray-400">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </span>
              <button
                onClick={() => onToggle(habit.id, dateStr)}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-md cursor-pointer flex items-center justify-center transition-all border-none
                  ${isCompleted ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                aria-label={`${date.toDateString()} - ${isCompleted ? 'Completed' : 'Not completed'}`}
                type="button"
              >
                {isCompleted ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className="text-sm font-semibold text-gray-300">
                    {date.getDate()}
                  </span>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onOpenStats(habit.id)}
          className="p-2 rounded-full hover:bg-gray-700 transition-colors"
          aria-label="View statistics"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 hover:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(habit.id)}
          className="p-2 rounded-full hover:bg-gray-700 transition-colors"
          aria-label="Delete habit"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 hover:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

