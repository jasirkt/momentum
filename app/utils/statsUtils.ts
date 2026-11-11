import { Habit } from '../types';
import { getLocalDateString } from './dateUtils';
import { calculateScheduledStreaks } from './scheduleUtils';

export type HabitStats = {
  total: number;
  currentStreak: number;
  longestStreak: number;
};

export const calculateHabitStats = (
  habit: Habit,
  today: string = getLocalDateString(new Date()),
): HabitStats => {
  const total = Object.keys(habit.dates).filter((date) => habit.dates[date]).length;
  const { currentStreak, longestStreak } = calculateScheduledStreaks(habit, today);
  return { total, currentStreak, longestStreak };
};

export const calculateStreak = (habit: Habit): number => {
  return calculateHabitStats(habit).currentStreak;
};
