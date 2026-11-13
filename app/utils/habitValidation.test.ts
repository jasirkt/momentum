import {
  validateAndNormalizeImportedHabits,
  ensureUniqueHabitIds,
  parseScheduleHistory,
  MAX_HABIT_NAME_LENGTH,
  MAX_SCHEDULE_ENTRIES,
} from './habitValidation';
import { Habit, ScheduleEntry } from '../types';
import { compressHabits } from './storageUtils';
import { getLocalDateString } from './dateUtils';
import { calculateHabitStats } from './statsUtils';

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

describe('parseScheduleHistory', () => {
  const weekdays = { type: 'weekdays', days: 0b0101010 };

  it('returns undefined when there is no usable history', () => {
    expect(parseScheduleHistory(undefined)).toBeUndefined();
    expect(parseScheduleHistory(null)).toBeUndefined();
    expect(parseScheduleHistory({ from: '2025-06-01', schedule: weekdays })).toBeUndefined();
    expect(parseScheduleHistory([])).toBeUndefined();
    expect(parseScheduleHistory([{ from: '2025-06-01', schedule: { type: 'daily' } }])).toBeUndefined();
  });

  it('accepts every schedule type', () => {
    const all: ScheduleEntry[] = [
      { from: '2025-01-01', schedule: { type: 'daily' } },
      { from: '2025-02-01', schedule: { type: 'weekdays', days: 0b1111111 } },
      { from: '2025-03-01', schedule: { type: 'perPeriod', period: 'week', count: 7 } },
      { from: '2025-04-01', schedule: { type: 'perPeriod', period: 'month', count: 31 } },
      { from: '2025-05-01', schedule: { type: 'interval', every: 366 } },
      { from: '2025-06-01', schedule: { type: 'afterLast', days: 1 } },
      { from: '2025-07-01', schedule: { type: 'monthDay', day: 31 } },
    ];
    expect(parseScheduleHistory(all)).toEqual(all);
  });

  it.each([
    ['unknown type', { type: 'hourly' }],
    ['missing type', {}],
    ['not an object', 'daily'],
    ['empty weekday mask', { type: 'weekdays', days: 0 }],
    ['weekday mask too large', { type: 'weekdays', days: 128 }],
    ['fractional count', { type: 'perPeriod', period: 'week', count: 1.5 }],
    ['8 per week', { type: 'perPeriod', period: 'week', count: 8 }],
    ['32 per month', { type: 'perPeriod', period: 'month', count: 32 }],
    ['unknown period', { type: 'perPeriod', period: 'year', count: 1 }],
    ['zero interval', { type: 'interval', every: 0 }],
    ['interval as a string', { type: 'interval', every: '3' }],
    ['negative afterLast', { type: 'afterLast', days: -1 }],
    ['afterLast too long', { type: 'afterLast', days: 367 }],
    ['monthDay 0', { type: 'monthDay', day: 0 }],
    ['monthDay 32', { type: 'monthDay', day: 32 }],
    ['NaN', { type: 'monthDay', day: NaN }],
  ])('drops an entry with an invalid schedule (%s)', (_label, schedule) => {
    const out = parseScheduleHistory([
      { from: '2025-06-01', schedule: weekdays },
      { from: '2025-06-10', schedule },
    ]);
    expect(out).toEqual([{ from: '2025-06-01', schedule: weekdays }]);
  });

  it.each([['2025-02-30'], ['2025-6-1'], ['20250601'], [''], [20250601], [null]])(
    'drops an entry with an invalid date (%p)',
    (from) => {
      expect(parseScheduleHistory([{ from, schedule: weekdays }])).toBeUndefined();
    },
  );

  it('drops entries that are not objects', () => {
    expect(parseScheduleHistory([null, 'x', 3, [], { from: '2025-06-01', schedule: weekdays }])).toEqual([
      { from: '2025-06-01', schedule: weekdays },
    ]);
  });

  it('strips unknown fields', () => {
    const out = parseScheduleHistory([
      { from: '2025-06-01', schedule: { ...weekdays, extra: true }, note: 'hi' },
    ]);
    expect(out).toEqual([{ from: '2025-06-01', schedule: weekdays }]);
  });

  it('sorts, keeps the last entry per day, and merges repeats', () => {
    const out = parseScheduleHistory([
      { from: '2025-06-10', schedule: { type: 'interval', every: 2 } },
      { from: '2025-06-01', schedule: weekdays },
      { from: '2025-06-10', schedule: { type: 'interval', every: 3 } },
      { from: '2025-06-20', schedule: { type: 'interval', every: 3 } },
    ]);
    expect(out).toEqual([
      { from: '2025-06-01', schedule: weekdays },
      { from: '2025-06-10', schedule: { type: 'interval', every: 3 } },
    ]);
  });

  it('caps the number of entries read', () => {
    // One entry per day, alternating so none merge.
    const many = Array.from({ length: MAX_SCHEDULE_ENTRIES + 50 }, (_, i) => ({
      from: getLocalDateString(new Date(2000, 0, 1 + i)),
      schedule: { type: 'interval', every: (i % 2) + 2 },
    }));
    const out = parseScheduleHistory(many)!;
    expect(out).toHaveLength(MAX_SCHEDULE_ENTRIES);
    expect(out[out.length - 1].from).toBe(many[MAX_SCHEDULE_ENTRIES - 1].from);
  });
});

describe('validateAndNormalizeImportedHabits with schedules', () => {
  const schedules: ScheduleEntry[] = [
    { from: '2025-01-01', schedule: { type: 'daily' } },
    { from: '2025-06-09', schedule: { type: 'perPeriod', period: 'week', count: 3 } },
  ];

  it('round-trips an export with schedules', () => {
    const habits: Habit[] = [
      { id: 1, name: 'Gym', dates: { '2025-06-09': true }, schedules },
      { id: 2, name: 'Walk', dates: { '2025-06-10': true } },
    ];
    const exported = JSON.parse(JSON.stringify(compressHabits(habits)));
    expect(validateAndNormalizeImportedHabits(exported)).toEqual(habits);
  });

  it('reads schedules in the legacy dates format', () => {
    const out = validateAndNormalizeImportedHabits([{ id: 1, name: 'Gym', dates: {}, schedules }]);
    expect(out[0].schedules).toEqual(schedules);
  });

  it('imports exports made before schedules existed as daily habits', () => {
    const old = [{ id: 1, name: 'Walk', yearlyData: { '2025': [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] } }];
    const [habit] = validateAndNormalizeImportedHabits(old);
    expect(habit).toEqual({ id: 1, name: 'Walk', dates: { '2025-01-01': true } });
    expect('schedules' in habit).toBe(false);
  });

  it('keeps the rest of the habit when its schedules are invalid', () => {
    const out = validateAndNormalizeImportedHabits([
      { id: 1, name: 'Gym', yearlyData: {}, schedules: 'weekly' },
      { id: 2, name: 'Run', yearlyData: {}, schedules: [{ from: 'bad', schedule: { type: 'daily' } }] },
    ]);
    expect(out).toEqual([
      { id: 1, name: 'Gym', dates: {} },
      { id: 2, name: 'Run', dates: {} },
    ]);
  });

  it('keeps schedules when reassigning duplicate ids', () => {
    const out = validateAndNormalizeImportedHabits([
      { id: 1, name: 'a', dates: {}, schedules },
      { id: 1, name: 'b', dates: {}, schedules },
    ]);
    expect(out[1].id).not.toBe(1);
    expect(out[1].schedules).toEqual(schedules);
  });
});

describe('validateAndNormalizeImportedHabits with archived', () => {
  it('reads archived in the bitmask format', () => {
    const out = validateAndNormalizeImportedHabits([{ id: 1, name: 'Old', yearlyData: {}, archived: true }]);
    expect(out[0].archived).toBe(true);
  });

  it('reads archived in the legacy dates format', () => {
    const out = validateAndNormalizeImportedHabits([{ id: 1, name: 'Old', dates: {}, archived: true }]);
    expect(out[0].archived).toBe(true);
  });

  it('treats a missing or non-true flag as active', () => {
    const out = validateAndNormalizeImportedHabits([
      { id: 1, name: 'A', yearlyData: {} },
      { id: 2, name: 'B', yearlyData: {}, archived: 'yes' },
      { id: 3, name: 'C', yearlyData: {}, archived: false },
    ]);
    expect(out.every((h) => !('archived' in h))).toBe(true);
  });
});

describe('dates that are not real calendar days', () => {
  it('drops legacy date keys that are not real days', () => {
    const out = validateAndNormalizeImportedHabits([
      {
        id: 1,
        name: 'Walk',
        dates: { '2025-02-30': true, '2025-13-01': true, '2025-00-10': true, '0050-01-01': true, '2025-03-01': true },
      },
    ]);
    expect(out[0].dates).toEqual({ '2025-03-01': true });
  });

  it('drops years that cannot be written as a YYYY-MM-DD key', () => {
    const bits = [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const out = validateAndNormalizeImportedHabits([
      { id: 1, name: 'Run', yearlyData: { '150': bits, '-5': bits, '99999': bits, '2025': bits } },
    ]);
    expect(out[0].dates).toEqual({ '2025-01-01': true });
  });

  it.each([
    ['legacy', [{ id: 1, name: 'Walk', dates: { '2025-02-30': true, '2025-03-01': true } }]],
    ['bitmask', [{ id: 1, name: 'Walk', yearlyData: { '150': [1], '2025': [1] } }]],
  ])('imported %s data with a bad date can still be scored and saved unchanged', (_format, raw) => {
    const [habit] = validateAndNormalizeImportedHabits(raw);
    expect(() => calculateHabitStats(habit, '2025-03-02')).not.toThrow();
    // What is in memory is exactly what comes back after a save and reload.
    expect(validateAndNormalizeImportedHabits(compressHabits([habit]))[0].dates).toEqual(habit.dates);
  });
});
