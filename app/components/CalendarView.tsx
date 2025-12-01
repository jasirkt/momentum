'use client';

import { useState, useMemo } from 'react';
import { Habit } from '../types';
import { getLocalDateString } from '../utils/dateUtils';

type CalendarViewProps = {
    habit: Habit;
    onToggle: (habitId: number, date: string) => void;
};

export default function CalendarView({ habit, onToggle }: CalendarViewProps) {
    const [currentDate, setCurrentDate] = useState(new Date());

    const changeMonth = (amount: number) => {
        setCurrentDate(prevDate => {
            const newDate = new Date(prevDate);
            newDate.setMonth(newDate.getMonth() + amount);
            return newDate;
        });
    };

    const calendarGrid = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday, etc.

        const grid = [];
        let week = [];

        // 1. Add blank cells for the days before the 1st of the month
        for (let i = 0; i < startingDayOfWeek; i++) {
            week.push(<td key={`blank-start-${i}`} className="p-1"></td>);
        }

        // 2. Fill in the actual days of the month
        for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
            const date = new Date(year, month, day);
            const dateStr = getLocalDateString(date);
            const isCompleted = habit.dates[dateStr] || false;

            const today = new Date();
            const isToday = date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();

            const dayClasses = `
        w-10 h-10 flex items-center justify-center rounded-full transition-all duration-150 cursor-pointer border-none
        ${isCompleted ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-700 hover:bg-gray-600'}
        ${isToday && !isCompleted ? 'ring-2 ring-indigo-400' : ''}
      `;

            week.push(
                <td key={dateStr} className="p-1 text-center">
                    <button
                        className={dayClasses}
                        onClick={() => onToggle(habit.id, dateStr)}
                        aria-label={`${date.toDateString()} - ${isCompleted ? 'Completed' : 'Not completed'}`}
                        type="button"
                    >
                        {day}
                    </button>
                </td>
            );

            if (week.length === 7) {
                grid.push(<tr key={`week-${grid.length}`}>{week}</tr>);
                week = [];
            }
        }

        // 3. Add blank cells for the end of the month to complete the week
        if (week.length > 0) {
            const remaining = 7 - week.length;
            for (let i = 0; i < remaining; i++) {
                week.push(<td key={`blank-end-${i}`} className="p-1"></td>);
            }
            grid.push(<tr key={`week-${grid.length}`}>{week}</tr>);
        }

        // 4. Add blank rows to ensure the calendar is always 6 weeks high
        while (grid.length < 6) {
            grid.push(<tr key={`pad-week-${grid.length}`}><td colSpan={7} className="p-1 h-12"></td></tr>);
        }

        return grid;
    }, [currentDate, habit.dates, onToggle, habit.id]);

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => changeMonth(-1)}
                    className="p-2 rounded-full hover:bg-gray-600 transition-colors"
                    aria-label="Previous month"
                    type="button"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                </button>
                <h3 className="text-lg font-semibold text-white w-32 text-center">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </h3>
                <button
                    onClick={() => changeMonth(1)}
                    className="p-2 rounded-full hover:bg-gray-600 transition-colors"
                    aria-label="Next month"
                    type="button"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" /></svg>
                </button>
            </div>
            <table className="w-full border-separate" style={{ borderSpacing: '0 0.25rem' }}>
                <thead>
                    <tr>
                        {weekdays.map(day => <th key={day} className="text-xs font-medium text-gray-400 pb-2">{day}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {calendarGrid}
                </tbody>
            </table>
        </div>
    );
}
