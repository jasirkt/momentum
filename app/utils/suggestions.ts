import { Schedule } from '../types';

export type HabitSuggestion = { name: string; schedule: Schedule };

// Weekday bitmasks (bit 0 = Sunday).
const MON_WED_FRI = 0b0101010;
const SUNDAY = 0b0000001;

const DAILY: Schedule = { type: 'daily' };

/**
 * One-tap starters shown on first run; nothing is added until the user taps one.
 *
 * Chosen to be habits most people actually want (sleep, movement, mind, relationships, planning),
 * short enough to read as a chip, and doable on day one. Exercise, calls and planning ship with
 * a schedule that fits how people really do them, so the first streaks are not punishing and the
 * schedule feature is visible without any explanation.
 */
export const HABIT_SUGGESTIONS: HabitSuggestion[] = [
  { name: 'Drink water', schedule: DAILY },
  { name: 'Walk', schedule: DAILY },
  { name: 'Read', schedule: DAILY },
  { name: 'Meditate', schedule: DAILY },
  { name: 'Journal', schedule: DAILY },
  { name: 'Stretch', schedule: DAILY },
  { name: 'Sleep by 11', schedule: DAILY },
  { name: 'Gym', schedule: { type: 'weekdays', days: MON_WED_FRI } },
  { name: 'Run', schedule: { type: 'perPeriod', period: 'week', count: 3 } },
  { name: 'Call family', schedule: { type: 'perPeriod', period: 'week', count: 1 } },
  { name: 'Plan the week', schedule: { type: 'weekdays', days: SUNDAY } },
];
