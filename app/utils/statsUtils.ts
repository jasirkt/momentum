import { Habit } from '../types';
import { diffCalendarDaysLocal, getLocalDateString } from './dateUtils';

export type HabitStats = {
  total: number;
  currentStreak: number;
  longestStreak: number;
};

export const calculateHabitStats = (habit: Habit): HabitStats => {
  const dates = Object.keys(habit.dates).filter((date) => habit.dates[date]);
  if (dates.length === 0) {
    return { total: 0, currentStreak: 0, longestStreak: 0 };
  }

  // YYYY-MM-DD lexicographic order matches chronological order for local calendar keys.
  dates.sort();

  let longestStreak = 0;
  let currentStreak = 0;

  longestStreak = 1;
  currentStreak = 1;

  for (let i = 1; i < dates.length; i++) {
    const gap = diffCalendarDaysLocal(dates[i - 1], dates[i]);
    if (gap === 1) {
      currentStreak++;
    } else {
      longestStreak = Math.max(longestStreak, currentStreak);
      currentStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, currentStreak);

  const todayStr = getLocalDateString(new Date());
  const lastStr = dates[dates.length - 1];
  const gapFromLastToToday = diffCalendarDaysLocal(lastStr, todayStr);
  if (gapFromLastToToday === null || gapFromLastToToday > 1) {
    currentStreak = 0;
  }

  return {
    total: dates.length,
    currentStreak,
    longestStreak,
  };
};

export const calculateStreak = (habit: Habit): number => {
  return calculateHabitStats(habit).currentStreak;
};
