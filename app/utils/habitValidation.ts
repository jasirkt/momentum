import { Habit, Schedule, ScheduleEntry, StoredHabit } from '../types';
import { parseLocalDateString } from './dateUtils';
import { normalizeScheduleHistory } from './scheduleUtils';
import { decompressHabits } from './storageUtils';

export const MAX_HABIT_NAME_LENGTH = 500;
export const MAX_IMPORT_FILE_BYTES = 2 * 1024 * 1024;

export const MAX_SCHEDULE_ENTRIES = 1000;

const CHUNKS_PER_YEAR = 12;

const ISO_DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

function assertNonEmptyString(name: unknown): string {
  if (typeof name !== 'string') throw new Error('Each habit must have a text name.');
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Habit names cannot be empty.');
  if (trimmed.length > MAX_HABIT_NAME_LENGTH) {
    throw new Error(`Habit names cannot exceed ${MAX_HABIT_NAME_LENGTH} characters.`);
  }
  return trimmed;
}

function assertFiniteId(id: unknown): number {
  if (typeof id !== 'number' || !Number.isFinite(id)) {
    throw new Error('Each habit must have a numeric id.');
  }
  return id;
}

function normalizeYearlyData(raw: unknown): Record<string, number[]> {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('yearlyData must be an object.');
  }
  const out: Record<string, number[]> = {};
  for (const key of Object.keys(raw)) {
    const year = parseInt(key, 10);
    if (!Number.isFinite(year) || String(year) !== key) continue;
    const arr = (raw as Record<string, unknown>)[key];
    if (!Array.isArray(arr)) continue;
    const padded = arr.slice(0, CHUNKS_PER_YEAR).map((n) =>
      typeof n === 'number' && Number.isFinite(n) ? n : 0,
    );
    while (padded.length < CHUNKS_PER_YEAR) padded.push(0);
    out[key] = padded;
  }
  return out;
}

function normalizeDatesObject(raw: unknown): Record<string, boolean> {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('dates must be an object.');
  }
  const dates: Record<string, boolean> = {};
  for (const key of Object.keys(raw)) {
    if (!ISO_DATE_KEY.test(key)) continue;
    const v = (raw as Record<string, unknown>)[key];
    if (v === true) dates[key] = true;
  }
  return dates;
}

const isIntIn = (n: unknown, min: number, max: number): n is number =>
  typeof n === 'number' && Number.isInteger(n) && n >= min && n <= max;

function parseSchedule(raw: unknown): Schedule | null {
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  switch (r.type) {
    case 'daily':
      return { type: 'daily' };
    case 'weekdays':
      return isIntIn(r.days, 1, 0b1111111) ? { type: 'weekdays', days: r.days } : null;
    case 'perPeriod':
      if (r.period === 'week' && isIntIn(r.count, 1, 7)) return { type: 'perPeriod', period: 'week', count: r.count };
      if (r.period === 'month' && isIntIn(r.count, 1, 31)) return { type: 'perPeriod', period: 'month', count: r.count };
      return null;
    case 'interval':
      return isIntIn(r.every, 1, 366) ? { type: 'interval', every: r.every } : null;
    case 'afterLast':
      return isIntIn(r.days, 1, 366) ? { type: 'afterLast', days: r.days } : null;
    case 'monthDay':
      return isIntIn(r.day, 1, 31) ? { type: 'monthDay', day: r.day } : null;
    default:
      return null;
  }
}

/**
 * Validates a schedule history from storage or an import file. Like unreadable date keys,
 * invalid entries are dropped rather than failing the whole load, so the days they covered fall
 * back to the schedule before them (or daily). Returns undefined for a plain daily habit.
 */
export function parseScheduleHistory(raw: unknown): ScheduleEntry[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const entries: ScheduleEntry[] = [];
  for (const item of raw.slice(0, MAX_SCHEDULE_ENTRIES)) {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) continue;
    const rec = item as Record<string, unknown>;
    if (typeof rec.from !== 'string' || !ISO_DATE_KEY.test(rec.from) || !parseLocalDateString(rec.from)) continue;
    const schedule = parseSchedule(rec.schedule);
    if (schedule) entries.push({ from: rec.from, schedule });
  }
  const normalized = normalizeScheduleHistory(entries);
  return normalized.length > 0 ? normalized : undefined;
}

const withSchedules = (raw: unknown) => {
  const schedules = parseScheduleHistory(raw);
  return schedules ? { schedules } : {};
};

// Only a literal `true` archives a habit; anything else (or missing) means active.
const withArchived = (raw: unknown) => (raw === true ? { archived: true } : {});

/** Ensures unique numeric ids for React keys and stable storage. */
export function ensureUniqueHabitIds(habits: Habit[]): Habit[] {
  const used = new Set<number>();
  let next = Date.now();
  return habits.map((h) => {
    let id = typeof h.id === 'number' && Number.isFinite(h.id) ? h.id : next++;
    while (used.has(id)) {
      id = ++next;
    }
    used.add(id);
    return id === h.id ? h : { ...h, id };
  });
}

function parseStoredHabits(items: unknown[]): StoredHabit[] {
  return items.map((item, index) => {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`Invalid habit at index ${index}.`);
    }
    const rec = item as Record<string, unknown>;
    const id = assertFiniteId(rec.id);
    const name = assertNonEmptyString(rec.name);
    const yearlyData = normalizeYearlyData(rec.yearlyData);
    return { id, name, yearlyData, ...withSchedules(rec.schedules), ...withArchived(rec.archived) };
  });
}

function parseLegacyHabits(items: unknown[]): Habit[] {
  return items.map((item, index) => {
    if (item === null || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`Invalid habit at index ${index}.`);
    }
    const rec = item as Record<string, unknown>;
    const id = assertFiniteId(rec.id);
    const name = assertNonEmptyString(rec.name);
    const dates = normalizeDatesObject(rec.dates);
    return { id, name, dates, ...withSchedules(rec.schedules), ...withArchived(rec.archived) };
  });
}

/**
 * Validates imported JSON (already parsed) and returns habits ready for app state.
 */
export function validateAndNormalizeImportedHabits(data: unknown): Habit[] {
  if (!Array.isArray(data)) {
    throw new Error('Import data must be a JSON array.');
  }
  if (data.length === 0) return [];

  const first = data[0];
  if (first === null || typeof first !== 'object' || Array.isArray(first)) {
    throw new Error('Invalid habit entry.');
  }

  const sample = first as Record<string, unknown>;
  if ('yearlyData' in sample) {
    const stored = parseStoredHabits(data);
    return ensureUniqueHabitIds(decompressHabits(stored));
  }
  if ('dates' in sample) {
    return ensureUniqueHabitIds(parseLegacyHabits(data));
  }

  throw new Error('Unrecognized file format.');
}
