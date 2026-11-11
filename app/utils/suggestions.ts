import { Schedule } from '../types';

export type HabitSuggestion = { name: string; schedule: Schedule };

// Mon/Wed/Fri in the weekdays bitmask (bit 0 = Sunday).
const MON_WED_FRI = 0b0101010;

/** One-tap starters shown on first run. Nothing is added until the user taps one. */
export const HABIT_SUGGESTIONS: HabitSuggestion[] = [
  { name: 'Drink water', schedule: { type: 'daily' } },
  { name: 'Walk', schedule: { type: 'daily' } },
  { name: 'Read', schedule: { type: 'daily' } },
  { name: 'Stretch', schedule: { type: 'daily' } },
  { name: 'Journal', schedule: { type: 'daily' } },
  { name: 'Sleep by 11', schedule: { type: 'daily' } },
  { name: 'Gym', schedule: { type: 'weekdays', days: MON_WED_FRI } },
];
