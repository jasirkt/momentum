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

  it('uses the habit schedule for streaks and counts every completion in total', () => {
    const habit: Habit = {
      id: 1,
      name: 'Gym',
      // Mon/Wed/Fri; 2025-06-02 is a Monday.
      dates: { '2025-06-02': true, '2025-06-04': true, '2025-06-06': true, '2025-06-09': true },
      schedules: [{ from: '2025-06-01', schedule: { type: 'weekdays', days: 0b0101010 } }],
    };
    expect(calculateHabitStats(habit, '2025-06-10')).toEqual({ total: 4, currentStreak: 4, longestStreak: 4 });
    expect(calculateHabitStats(habit, '2025-06-12')).toEqual({ total: 4, currentStreak: 0, longestStreak: 4 });
  });
});
