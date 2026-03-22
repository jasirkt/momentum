import { validateAndNormalizeImportedHabits, ensureUniqueHabitIds, MAX_HABIT_NAME_LENGTH } from './habitValidation';
import { Habit } from '../types';

describe('validateAndNormalizeImportedHabits', () => {
  it('accepts empty array', () => {
    expect(validateAndNormalizeImportedHabits([])).toEqual([]);
  });

  it('rejects non-array root', () => {
    expect(() => validateAndNormalizeImportedHabits({})).toThrow(/array/);
  });

  it('parses legacy format with ISO date keys', () => {
    const raw = [{ id: 1, name: 'Walk', dates: { '2025-03-01': true, 'bad-key': true as unknown as boolean } }];
    const out = validateAndNormalizeImportedHabits(raw);
    expect(out).toHaveLength(1);
    expect(out[0].dates).toEqual({ '2025-03-01': true });
  });

  it('parses optimized format via decompress', () => {
    const raw = [{ id: 1, name: 'Run', yearlyData: { '2025': new Array(12).fill(0) } }];
    const out = validateAndNormalizeImportedHabits(raw);
    expect(out[0].name).toBe('Run');
    expect(out[0].dates).toEqual({});
  });

  it('rejects name longer than max', () => {
    const long = 'x'.repeat(MAX_HABIT_NAME_LENGTH + 1);
    expect(() =>
      validateAndNormalizeImportedHabits([{ id: 1, name: long, dates: {} }]),
    ).toThrow();
  });
});

describe('ensureUniqueHabitIds', () => {
  it('reassigns duplicate ids', () => {
    const habits: Habit[] = [
      { id: 1, name: 'a', dates: {} },
      { id: 1, name: 'b', dates: {} },
    ];
    const out = ensureUniqueHabitIds(habits);
    expect(out[0].id).toBe(1);
    expect(out[1].id).not.toBe(1);
  });
});
