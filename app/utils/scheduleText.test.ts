import { describeDue, describeSchedule, formatUpcomingDay, ordinal } from './scheduleText';
import { Schedule } from '../types';

describe('ordinal', () => {
  it.each([
    [1, '1st'], [2, '2nd'], [3, '3rd'], [4, '4th'], [11, '11th'], [12, '12th'], [13, '13th'],
    [21, '21st'], [22, '22nd'], [23, '23rd'], [30, '30th'], [31, '31st'], [111, '111th'],
  ])('%i → %s', (n, expected) => {
    expect(ordinal(n)).toBe(expected);
  });
});

describe('describeSchedule', () => {
  it.each<[Schedule, string]>([
    [{ type: 'daily' }, 'Every day'],
    [{ type: 'weekdays', days: 0b0101010 }, 'Mon, Wed, Fri'],
    [{ type: 'weekdays', days: 0b1000010 }, 'Mon, Sat'],
    [{ type: 'weekdays', days: 0b0000001 }, 'Sun'],
    [{ type: 'weekdays', days: 0b1000001 }, 'Weekends'],
    [{ type: 'weekdays', days: 0b0111110 }, 'Weekdays'],
    [{ type: 'weekdays', days: 0b1111111 }, 'Every day'],
    [{ type: 'perPeriod', period: 'week', count: 1 }, 'Once a week'],
    [{ type: 'perPeriod', period: 'week', count: 2 }, 'Twice a week'],
    [{ type: 'perPeriod', period: 'month', count: 4 }, '4 times a month'],
    [{ type: 'interval', every: 1 }, 'Every day'],
    [{ type: 'interval', every: 3 }, 'Every 3 days'],
    [{ type: 'afterLast', days: 1 }, 'Within 1 day of last time'],
    [{ type: 'afterLast', days: 10 }, 'Within 10 days of last time'],
    [{ type: 'monthDay', day: 1 }, 'The 1st of each month'],
    [{ type: 'monthDay', day: 28 }, 'The 28th of each month'],
    [{ type: 'monthDay', day: 30 }, 'The 30th of each month, or the last day'],
    [{ type: 'monthDay', day: 31 }, 'Last day of each month'],
  ])('%j → %s', (schedule, expected) => {
    expect(describeSchedule(schedule)).toBe(expected);
  });
});

describe('formatUpcomingDay', () => {
  // 2025-06-12 is a Thursday.
  const today = '2025-06-12';

  it('uses relative words for today and tomorrow', () => {
    expect(formatUpcomingDay('2025-06-12', today)).toBe('today');
    expect(formatUpcomingDay('2025-06-13', today)).toBe('tomorrow');
  });

  it('uses the weekday within the next week', () => {
    expect(formatUpcomingDay('2025-06-14', today)).toBe('Saturday');
    expect(formatUpcomingDay('2025-06-18', today)).toBe('Wednesday');
  });

  it('uses a short date from a week out', () => {
    expect(formatUpcomingDay('2025-06-19', today)).toBe('19 Jun');
    expect(formatUpcomingDay('2026-01-01', today)).toBe('1 Jan');
  });
});

describe('describeDue', () => {
  const today = '2025-06-12';
  const daily: Schedule = { type: 'daily' };
  const weekly: Schedule = { type: 'perPeriod', period: 'week', count: 3 };
  const monthly: Schedule = { type: 'perPeriod', period: 'month', count: 2 };

  it('describes due and done', () => {
    expect(describeDue({ status: 'due', nextDue: today }, daily, today)).toBe('Due today');
    expect(describeDue({ status: 'done', nextDue: '2025-06-13' }, daily, today)).toBe('Done for today');
  });

  it('describes progress toward a weekly or monthly target', () => {
    expect(describeDue({ status: 'due', nextDue: today, remaining: 2 }, weekly, today)).toBe('2 more this week');
    expect(describeDue({ status: 'due', nextDue: today, remaining: 1 }, monthly, today)).toBe('1 more this month');
    expect(describeDue({ status: 'done', nextDue: '2025-06-16', remaining: 0 }, weekly, today)).toBe('Done this week');
  });

  it('describes how late an overdue habit is', () => {
    const afterLast: Schedule = { type: 'afterLast', days: 3 };
    expect(describeDue({ status: 'overdue', nextDue: '2025-06-11' }, afterLast, today)).toBe('1 day overdue');
    expect(describeDue({ status: 'overdue', nextDue: '2025-06-08' }, afterLast, today)).toBe('4 days overdue');
  });

  it('describes the next due day', () => {
    const mwf: Schedule = { type: 'weekdays', days: 0b0101010 };
    expect(describeDue({ status: 'upcoming', nextDue: '2025-06-13' }, mwf, today)).toBe('Next: tomorrow');
    expect(describeDue({ status: 'upcoming', nextDue: null }, mwf, today)).toBe('Not scheduled');
  });
});
