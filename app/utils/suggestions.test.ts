import { HABIT_SUGGESTIONS } from './suggestions';
import { MAX_HABIT_NAME_LENGTH } from './habitValidation';

describe('HABIT_SUGGESTIONS', () => {
  it('has unique, chip-sized names that fit the habit name limit', () => {
    const names = HABIT_SUGGESTIONS.map((s) => s.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
    for (const { name } of HABIT_SUGGESTIONS) {
      expect(name.length).toBeLessThanOrEqual(MAX_HABIT_NAME_LENGTH);
      expect(name.length).toBeLessThanOrEqual(16);
    }
  });

  it('uses valid weekday masks and counts', () => {
    for (const { schedule } of HABIT_SUGGESTIONS) {
      if (schedule.type === 'weekdays') {
        expect(schedule.days).toBeGreaterThan(0);
        expect(schedule.days).toBeLessThanOrEqual(0b1111111);
      }
      if (schedule.type === 'perPeriod') expect(schedule.count).toBeGreaterThanOrEqual(1);
    }
  });

  it('shows more than one kind of schedule', () => {
    const types = new Set(HABIT_SUGGESTIONS.map((s) => s.schedule.type));
    expect(types.size).toBeGreaterThanOrEqual(3);
  });
});
