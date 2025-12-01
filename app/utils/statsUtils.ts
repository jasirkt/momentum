import { Habit } from '../types';

export type HabitStats = {
    total: number;
    currentStreak: number;
    longestStreak: number;
};

export const calculateHabitStats = (habit: Habit): HabitStats => {
    const dates = Object.keys(habit.dates).filter(date => habit.dates[date]);
    if (dates.length === 0) {
        return { total: 0, currentStreak: 0, longestStreak: 0 };
    }

    dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    let longestStreak = 0;
    let currentStreak = 0;

    if (dates.length > 0) {
        longestStreak = 1;
        currentStreak = 1;

        for (let i = 1; i < dates.length; i++) {
            const currentDate = new Date(dates[i]);
            const prevDate = new Date(dates[i - 1]);
            const diffTime = currentDate.getTime() - prevDate.getTime();
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                currentStreak++;
            } else {
                longestStreak = Math.max(longestStreak, currentStreak);
                currentStreak = 1;
            }
        }
        longestStreak = Math.max(longestStreak, currentStreak);

        const today = new Date();
        const lastDate = new Date(dates[dates.length - 1]);

        // Normalize today to midnight for accurate day difference
        today.setHours(0, 0, 0, 0);
        // lastDate is already effectively midnight UTC from the string, but let's be careful.
        // The original code used `new Date(string)` which is UTC for YYYY-MM-DD.
        // However, `today` is local. This might be a subtle bug in the original code too if timezones are involved.
        // Let's stick to the original logic's intent but maybe safer.
        // Actually, let's keep it close to original for now to avoid changing behavior, 
        // but we should probably use the dateUtils helpers if we can.
        // For now, simple copy-paste logic refactor.

        const diffTime = today.getTime() - lastDate.getTime();
        const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 1) {
            currentStreak = 0;
        }
    }

    return {
        total: dates.length,
        currentStreak: currentStreak,
        longestStreak: longestStreak,
    };
};

export const calculateStreak = (habit: Habit): number => {
    return calculateHabitStats(habit).currentStreak;
};
