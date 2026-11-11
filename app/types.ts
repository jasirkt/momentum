/**
 * How often a habit is expected to be completed.
 * - daily: every day.
 * - weekdays: specific days of the week. `days` is a 7-bit mask where bit 0 is Sunday
 *   and bit 6 is Saturday (matching `Date.getDay()`), e.g. Mon/Wed/Fri = 0b0101010.
 * - perPeriod: at least `count` completions per calendar week (Monday–Sunday) or month.
 * - interval: every `every` days on a fixed grid, anchored at the date the schedule took effect.
 * - afterLast: within `days` days of the previous completion (the clock resets on each completion).
 * - monthDay: on day `day` of each month; days past the month's end fall on its last day.
 */
export type Schedule =
  | { type: 'daily' }
  | { type: 'weekdays'; days: number }
  | { type: 'perPeriod'; period: 'week' | 'month'; count: number }
  | { type: 'interval'; every: number }
  | { type: 'afterLast'; days: number }
  | { type: 'monthDay'; day: number };

/**
 * One entry of a habit's schedule history. The schedule applies from `from` ("YYYY-MM-DD")
 * until the next entry's `from`. The first entry also covers any dates before its `from`.
 */
export type ScheduleEntry = {
  from: string;
  schedule: Schedule;
};

// Primary data structure used within the application's state for rendering and interaction.
export type Habit = {
  id: number;
  name: string;
  dates: Record<string, boolean>; // An object with "YYYY-MM-DD" keys for easy lookups.
  schedules?: ScheduleEntry[]; // Sorted by `from`. Missing or empty means daily.
};

// Optimized data structure used for saving to localStorage and for import/export.
export type StoredHabit = {
    id: number;
    name: string;
    yearlyData: Record<string, number[]>; // Bitmask format: { "2025": [123, 456, ...] }
    schedules?: ScheduleEntry[];
};
