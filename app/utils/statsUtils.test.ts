import { calculateHabitStats } from './statsUtils';
import { Habit } from '../types';

describe('calculateHabitStats', () => {
  const originalTZ = process.env.TZ;

  afterEach(() => {
    if (originalTZ === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = originalTZ;
    }
  });

  it('counts consecutive local calendar days as one streak', () => {
    const habit: Habit = {
      id: 1,
      name: 'Test',
      dates: {
        '2025-01-31': true,
        '2025-02-01': true,
      },
    };
    const stats = calculateHabitStats(habit);
    expect(stats.longestStreak).toBe(2);
  });

  it('uses local date for "today" vs last completion (America/Los_Angeles)', () => {
    process.env.TZ = 'America/Los_Angeles';
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-06-15T12:00:00'));

    const habit: Habit = {
      id: 1,
      name: 'Test',
      dates: {
        '2025-06-14': true,
      },
    };
    const stats = calculateHabitStats(habit);
    expect(stats.currentStreak).toBe(1);

    jest.useRealTimers();
  });

  it('breaks current streak when last completion is more than one local day ago', () => {
    process.env.TZ = 'UTC';
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-06-15T12:00:00'));

    const habit: Habit = {
      id: 1,
      name: 'Test',
      dates: {
        '2025-06-12': true,
      },
    };
    const stats = calculateHabitStats(habit);
    expect(stats.currentStreak).toBe(0);

    jest.useRealTimers();
  });
});
