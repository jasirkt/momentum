import { Habit, StoredHabit } from '../types';
import { decompressHabits } from './storageUtils';

export const MAX_HABIT_NAME_LENGTH = 500;
export const MAX_IMPORT_FILE_BYTES = 2 * 1024 * 1024;

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
    return { id, name, yearlyData };
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
    return { id, name, dates };
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
