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
});
