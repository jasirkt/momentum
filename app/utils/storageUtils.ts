import { Habit, StoredHabit } from '../types';
import { getDayOfYear, dateFromDay, getLocalDateString } from './dateUtils';

// --- DATA COMPRESSION & DECOMPRESSION ---

/**
 * Converts the application's habit state into an optimized, bitmask format for storage.
 * @param habits The array of Habit objects from the application state.
 * @returns An array of StoredHabit objects ready for serialization.
 */
export const compressHabits = (habits: Habit[]): StoredHabit[] => {
    return habits.map(habit => {
        const yearlyData: Record<string, number[]> = {};
        for (const dateStr in habit.dates) {
            if (habit.dates[dateStr]) {
                const [year, month, day] = dateStr.split('-').map(Number);
                const localDate = new Date(year, month - 1, day);
                const currentYear = localDate.getFullYear();
                const dayOfYear = getDayOfYear(localDate);
                
                if (dayOfYear > 0 && dayOfYear <= 366) {
                    const chunkIndex = Math.floor((dayOfYear - 1) / 32);
                    const bitIndex = (dayOfYear - 1) % 32;
                    if (!yearlyData[currentYear]) {
                        yearlyData[currentYear] = new Array(12).fill(0);
                    }
                    yearlyData[currentYear][chunkIndex] |= (1 << bitIndex);
                }
            }
        }
        return { id: habit.id, name: habit.name, yearlyData: yearlyData };
    });
};

/**
 * Converts the optimized, bitmask data from storage back into the application's state format.
 * @param storedHabits The array of StoredHabit objects from localStorage or an import file.
 * @returns An array of Habit objects ready for use in the application state.
 */
export const decompressHabits = (storedHabits: StoredHabit[]): Habit[] => {
    return storedHabits.map(storedHabit => {
        const dates: Record<string, boolean> = {};
        for (const yearStr in storedHabit.yearlyData) {
            const year = parseInt(yearStr, 10);
            const chunks = storedHabit.yearlyData[yearStr];
            if (Array.isArray(chunks)) {
                chunks.forEach((chunk: number, chunkIndex: number) => {
                    for (let bitIndex = 0; bitIndex < 32; bitIndex++) {
                        if ((chunk >> bitIndex) & 1) {
                            const dayOfYear = (chunkIndex * 32) + bitIndex + 1;
                            const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
                            if (dayOfYear > (isLeap ? 366 : 365)) continue;
                            const date = dateFromDay(year, dayOfYear);
                            if (date.getFullYear() === year) {
                                dates[getLocalDateString(date)] = true;
                            }
                        }
                    }
                });
            }
        }
        return { id: storedHabit.id, name: storedHabit.name, dates: dates };
    });
};
