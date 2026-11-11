import { compressHabits, decompressHabits } from './storageUtils';
import { Habit, StoredHabit } from '../types';

describe('Storage Utility Functions', () => {

  describe('compressHabits and decompressHabits', () => {

    it('should handle an empty array of habits', () => {
      const habits: Habit[] = [];
      const compressed = compressHabits(habits);
      expect(compressed).toEqual([]);
      const decompressed = decompressHabits(compressed);
      expect(decompressed).toEqual([]);
    });

    it('should correctly compress a single habit with a few dates', () => {
      const habits: Habit[] = [
        {
          id: 1,
          name: 'Test Habit',
          dates: {
            '2025-01-01': true, // Day 1
            '2025-02-01': true, // Day 32
            '2025-02-02': true, // Day 33
          },
        },
      ];

      const compressed = compressHabits(habits);

      // Expected bitmask calculation:
      // Day 1: chunk 0, bit 0  => 1 << 0 = 1
      // Day 32: chunk 0, bit 31 => 1 << 31 = 2147483648
      // Day 33: chunk 1, bit 0  => 1 << 0 = 1
      const expected: StoredHabit[] = [
        {
          id: 1,
          name: 'Test Habit',
          yearlyData: {
            '2025': [-2147483647, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          },
        },
      ];

      expect(compressed).toEqual(expected);
    });

    it('should be symmetrical: compressing and then decompressing should return the original data', () => {
      const originalHabits: Habit[] = [
        {
          id: 1,
          name: 'Daily Walk',
          dates: {
            '2025-09-19': true,
            '2025-09-20': true,
            '2024-12-31': true,
          },
        },
        {
          id: 2,
          name: 'Read a book',
          dates: {},
        },
      ];

      const compressed = compressHabits(originalHabits);
      const decompressed = decompressHabits(compressed);

      expect(decompressed).toEqual(originalHabits);
    });

    it('should handle leap years correctly', () => {
      const leapYearHabits: Habit[] = [
        {
          id: 1,
          name: 'Leap Day Habit',
          dates: {
            '2024-02-29': true, // Day 60 of a leap year
            '2024-12-31': true, // Day 366 of a leap year
          }
        }
      ];

      const compressed = compressHabits(leapYearHabits);
      const decompressed = decompressHabits(compressed);

      expect(decompressed).toEqual(leapYearHabits);
    });

    it('should handle dates from multiple years correctly', () => {
      const multiYearHabits: Habit[] = [
        {
          id: 1,
          name: 'Long Term Goal',
          dates: {
            '2024-01-01': true,
            '2025-01-01': true,
          }
        }
      ];

      const compressed = compressHabits(multiYearHabits);
      const decompressed = decompressHabits(compressed);

      expect(decompressed).toEqual(multiYearHabits);
    });

  });

  describe('schedules', () => {
    const schedules = [
      { from: '2025-01-01', schedule: { type: 'daily' as const } },
      { from: '2025-06-09', schedule: { type: 'weekdays' as const, days: 0b0101010 } },
    ];

    it('round-trips a schedule history', () => {
      const habits: Habit[] = [{ id: 1, name: 'Gym', dates: { '2025-06-09': true }, schedules }];
      const compressed = compressHabits(habits);
      expect(compressed[0].schedules).toEqual(schedules);
      expect(decompressHabits(compressed)).toEqual(habits);
    });

    it('survives JSON serialization', () => {
      const habits: Habit[] = [{ id: 1, name: 'Gym', dates: {}, schedules }];
      const reloaded = decompressHabits(JSON.parse(JSON.stringify(compressHabits(habits))));
      expect(reloaded).toEqual(habits);
    });

    it('writes daily habits in exactly the old format', () => {
      const compressed = compressHabits([
        { id: 1, name: 'Walk', dates: {} },
        { id: 2, name: 'Read', dates: {}, schedules: [] },
      ]);
      expect(compressed).toEqual([
        { id: 1, name: 'Walk', yearlyData: {} },
        { id: 2, name: 'Read', yearlyData: {} },
      ]);
      expect(compressed.every((h) => !('schedules' in h))).toBe(true);
    });

    it('reads data saved before schedules existed as daily habits', () => {
      const old: StoredHabit[] = [{ id: 1, name: 'Walk', yearlyData: { '2025': [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] } }];
      const [habit] = decompressHabits(old);
      expect(habit).toEqual({ id: 1, name: 'Walk', dates: { '2025-01-01': true } });
      expect('schedules' in habit).toBe(false);
    });

    it('keeps schedules when yearlyData is unreadable', () => {
      const broken = [{ id: 1, name: 'Gym', yearlyData: null, schedules }] as unknown as StoredHabit[];
      expect(decompressHabits(broken)).toEqual([{ id: 1, name: 'Gym', dates: {}, schedules }]);
    });
  });

  describe('archived flag', () => {
    it('writes archived only when true, so active habits keep the old format', () => {
      const compressed = compressHabits([
        { id: 1, name: 'Old', dates: {}, archived: true },
        { id: 2, name: 'Active', dates: {} },
        { id: 3, name: 'Restored', dates: {}, archived: false },
      ]);
      expect(compressed[0]).toEqual({ id: 1, name: 'Old', yearlyData: {}, archived: true });
      expect('archived' in compressed[1]).toBe(false);
      expect('archived' in compressed[2]).toBe(false);
    });

    it('round-trips archived with its history and schedules', () => {
      const schedules = [{ from: '2025-01-01', schedule: { type: 'weekdays' as const, days: 0b0101010 } }];
      const habits: Habit[] = [
        { id: 1, name: 'Old', dates: { '2025-01-01': true }, schedules, archived: true },
      ];
      expect(decompressHabits(JSON.parse(JSON.stringify(compressHabits(habits))))).toEqual(habits);
    });

    it('keeps archived when yearlyData is unreadable', () => {
      const broken = [{ id: 1, name: 'Old', yearlyData: null, archived: true }] as unknown as StoredHabit[];
      expect(decompressHabits(broken)).toEqual([{ id: 1, name: 'Old', dates: {}, archived: true }]);
    });

    it('reads data saved before archiving existed as active', () => {
      const [habit] = decompressHabits([{ id: 1, name: 'Walk', yearlyData: {} }]);
      expect('archived' in habit).toBe(false);
    });
  });
});
