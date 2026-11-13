import { Habit, Schedule, ScheduleEntry } from '../types';
import {
  calculateScheduledStreaks,
  countExpectedCheckIns,
  getDueInfo,
  getScheduleHistory,
  getScheduleOn,
  schedulesEqual,
  setSchedule,
} from './scheduleUtils';

// Calendar reference: 2025-06-01 is a Sunday. Weeks run Monday–Sunday: Jun 2–8, 9–15, 16–22.
//   Mon 2  9 16 23 30 | Tue 3 10 17 24 | Wed 4 11 18 25 | Thu 5 12 19 26
//   Fri 6 13 20 27    | Sat 7 14 21 28 | Sun 1  8 15 22 29

const MWF = 0b0101010; // Mon, Wed, Fri

const habit = (dates: string[], schedules?: ScheduleEntry[]): Habit => ({
  id: 1,
  name: 'Test',
  dates: Object.fromEntries(dates.map((d) => [d, true])),
  ...(schedules ? { schedules } : {}),
});

const only = (schedule: Schedule, from = '2025-06-01'): ScheduleEntry[] => [{ from, schedule }];

const june = (...days: number[]) => days.map((d) => `2025-06-${String(d).padStart(2, '0')}`);

const streaks = (h: Habit, today: string) => calculateScheduledStreaks(h, today);

describe('schedule history', () => {
  it('treats a habit without schedules as daily', () => {
    expect(getScheduleOn(habit([]), '2025-06-01')).toEqual({ type: 'daily' });
    expect(getScheduleOn(habit([], []), '2025-06-01')).toEqual({ type: 'daily' });
  });

  it('sorts history and resolves the schedule in effect on each day', () => {
    const h = habit([], [
      { from: '2025-06-10', schedule: { type: 'weekdays', days: MWF } },
      { from: '2025-06-01', schedule: { type: 'daily' } },
    ]);
    expect(getScheduleHistory(h).map((e) => e.from)).toEqual(['2025-06-01', '2025-06-10']);
    expect(getScheduleOn(h, '2025-06-09')).toEqual({ type: 'daily' });
    expect(getScheduleOn(h, '2025-06-10')).toEqual({ type: 'weekdays', days: MWF });
    expect(getScheduleOn(h, '2025-07-01')).toEqual({ type: 'weekdays', days: MWF });
  });

  it('applies the first entry to dates before it', () => {
    const h = habit([], only({ type: 'interval', every: 2 }, '2025-06-10'));
    expect(getScheduleOn(h, '2025-01-01')).toEqual({ type: 'interval', every: 2 });
  });

  it('compares schedules by value', () => {
    expect(schedulesEqual({ type: 'interval', every: 3 }, { type: 'interval', every: 3 })).toBe(true);
    expect(schedulesEqual({ type: 'interval', every: 3 }, { type: 'interval', every: 4 })).toBe(false);
    expect(schedulesEqual({ type: 'afterLast', days: 3 }, { type: 'interval', every: 3 })).toBe(false);
    expect(
      schedulesEqual(
        { type: 'perPeriod', period: 'week', count: 2 },
        { type: 'perPeriod', period: 'month', count: 2 },
      ),
    ).toBe(false);
  });
});

describe('setSchedule', () => {
  const weekly3: Schedule = { type: 'perPeriod', period: 'week', count: 3 };

  it('keeps a plain daily habit as an empty history', () => {
    expect(setSchedule(habit(june(1, 2)), { type: 'daily' }, '2025-06-10')).toEqual([]);
  });

  it('preserves the daily past of an existing habit', () => {
    expect(setSchedule(habit(june(3, 1, 2)), weekly3, '2025-06-10')).toEqual([
      { from: '2025-06-01', schedule: { type: 'daily' } },
      { from: '2025-06-10', schedule: weekly3 },
    ]);
  });

  it('starts a habit without completions directly on the new schedule', () => {
    expect(setSchedule(habit([]), weekly3, '2025-06-10')).toEqual([
      { from: '2025-06-10', schedule: weekly3 },
    ]);
  });

  it('appends later changes', () => {
    const h = habit(june(1), setSchedule(habit(june(1)), weekly3, '2025-06-05'));
    expect(setSchedule(h, { type: 'afterLast', days: 2 }, '2025-06-10')).toEqual([
      { from: '2025-06-01', schedule: { type: 'daily' } },
      { from: '2025-06-05', schedule: weekly3 },
      { from: '2025-06-10', schedule: { type: 'afterLast', days: 2 } },
    ]);
  });

  it('keeps only the last change made on the same day', () => {
    const h = habit(june(1), setSchedule(habit(june(1)), weekly3, '2025-06-10'));
    expect(setSchedule(h, { type: 'interval', every: 2 }, '2025-06-10')).toEqual([
      { from: '2025-06-01', schedule: { type: 'daily' } },
      { from: '2025-06-10', schedule: { type: 'interval', every: 2 } },
    ]);
  });

  it('removes a same-day change when switching back', () => {
    const h = habit(june(1), setSchedule(habit(june(1)), weekly3, '2025-06-10'));
    expect(setSchedule(h, { type: 'daily' }, '2025-06-10')).toEqual([]);

    const fresh = habit([], setSchedule(habit([]), weekly3, '2025-06-10'));
    expect(setSchedule(fresh, { type: 'daily' }, '2025-06-10')).toEqual([]);
  });

  it('does nothing when the schedule is unchanged', () => {
    const history = only(weekly3);
    expect(setSchedule(habit(june(1), history), { ...weekly3 }, '2025-06-10')).toEqual(history);
  });
});

describe('calculateScheduledStreaks', () => {
  it('returns zeros without completions, or with only future ones', () => {
    expect(streaks(habit([]), '2025-06-10')).toEqual({ currentStreak: 0, longestStreak: 0 });
    expect(streaks(habit(june(11)), '2025-06-10')).toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  it('ignores completions after today', () => {
    expect(streaks(habit(june(9, 10, 11, 12)), '2025-06-10').currentStreak).toBe(2);
  });

  describe('daily (no schedule)', () => {
    it('counts consecutive days and stays alive until today ends', () => {
      expect(streaks(habit(june(1, 2, 3)), '2025-06-03')).toEqual({ currentStreak: 3, longestStreak: 3 });
      expect(streaks(habit(june(1, 2, 3)), '2025-06-04').currentStreak).toBe(3);
    });

    it('breaks on a missed day and keeps the longest run', () => {
      expect(streaks(habit(june(1, 2, 3, 5, 6)), '2025-06-06')).toEqual({ currentStreak: 2, longestStreak: 3 });
      expect(streaks(habit(june(1, 2, 3)), '2025-06-05')).toEqual({ currentStreak: 0, longestStreak: 3 });
    });

    it('counts across month and year boundaries', () => {
      expect(streaks(habit(['2024-12-31', '2025-01-01']), '2025-01-01').currentStreak).toBe(2);
      expect(streaks(habit(['2025-05-31', '2025-06-01']), '2025-06-01').currentStreak).toBe(2);
    });
  });

  describe('weekdays', () => {
    const h = (dates: string[]) => habit(dates, only({ type: 'weekdays', days: MWF }));

    it('skips days that are not scheduled', () => {
      expect(streaks(h(june(2, 4, 6, 9, 11)), '2025-06-12').currentStreak).toBe(5);
    });

    it('breaks on a missed scheduled day', () => {
      expect(streaks(h(june(2, 4, 6, 11)), '2025-06-12')).toEqual({ currentStreak: 1, longestStreak: 3 });
    });

    it('counts completions on unscheduled days', () => {
      expect(streaks(h(june(2, 3, 4)), '2025-06-05').currentStreak).toBe(3);
    });

    it('does not break while today is still open', () => {
      expect(streaks(h(june(2, 4)), '2025-06-06').currentStreak).toBe(2);
    });

    it('breaks once a scheduled day has passed', () => {
      expect(streaks(h(june(2, 4)), '2025-06-09')).toEqual({ currentStreak: 0, longestStreak: 2 });
    });
  });

  describe('interval', () => {
    // Every 3 days from Jun 1: due on 1, 4, 7, 10, 13.
    const h = (dates: string[]) => habit(dates, only({ type: 'interval', every: 3 }));

    it('counts completions on due days', () => {
      expect(streaks(h(june(1, 4, 7)), '2025-06-09').currentStreak).toBe(3);
    });

    it('breaks when a due day is missed, even if done a day late', () => {
      expect(streaks(h(june(1, 4, 8)), '2025-06-09')).toEqual({ currentStreak: 1, longestStreak: 2 });
    });

    it('extends the grid backwards before the anchor', () => {
      expect(streaks(h(['2025-05-29', '2025-06-01']), '2025-06-02').currentStreak).toBe(2);
      expect(streaks(h(['2025-05-28', '2025-06-01']), '2025-06-02').currentStreak).toBe(1);
    });
  });

  describe('monthDay', () => {
    it('falls on the last day of shorter months', () => {
      const h = habit(['2025-01-31', '2025-02-28', '2025-03-31', '2025-04-30'], only({ type: 'monthDay', day: 31 }, '2025-01-01'));
      expect(streaks(h, '2025-05-01').currentStreak).toBe(4);
    });

    it('uses Feb 29 in leap years', () => {
      const h = habit(['2024-01-30', '2024-02-29'], only({ type: 'monthDay', day: 30 }, '2024-01-01'));
      expect(streaks(h, '2024-03-01').currentStreak).toBe(2);
      const missed = habit(['2024-01-30', '2024-03-01'], only({ type: 'monthDay', day: 30 }, '2024-01-01'));
      expect(streaks(missed, '2024-03-02')).toEqual({ currentStreak: 1, longestStreak: 1 });
    });

    it('breaks when the day is missed', () => {
      const h = habit(['2025-01-31', '2025-03-31'], only({ type: 'monthDay', day: 31 }, '2025-01-01'));
      expect(streaks(h, '2025-04-01')).toEqual({ currentStreak: 1, longestStreak: 1 });
    });
  });

  describe('perPeriod week', () => {
    const h = (dates: string[]) => habit(dates, only({ type: 'perPeriod', period: 'week', count: 3 }));

    it('counts completions while each week meets its target', () => {
      expect(streaks(h(june(2, 3, 4, 9, 10, 12)), '2025-06-16').currentStreak).toBe(6);
    });

    it('breaks when a finished week falls short', () => {
      expect(streaks(h(june(2, 3, 4, 9, 10, 16)), '2025-06-17')).toEqual({ currentStreak: 1, longestStreak: 5 });
    });

    it('starts weeks on Monday', () => {
      // Sunday Jun 8 belongs to the week of Monday Jun 2.
      expect(streaks(h(june(2, 3, 8)), '2025-06-09').currentStreak).toBe(3);
      // Sunday Jun 1 belongs to the week before, so the week of Jun 2 has only two.
      expect(streaks(h(june(1, 2, 3)), '2025-06-09')).toEqual({ currentStreak: 0, longestStreak: 3 });
    });

    it('does not judge the current week before it ends', () => {
      expect(streaks(h(june(2, 3, 4, 9)), '2025-06-15').currentStreak).toBe(4);
      expect(streaks(h(june(2, 3, 4, 9)), '2025-06-16').currentStreak).toBe(0);
    });

    it('does not judge a week that began before the first completion', () => {
      expect(streaks(h(june(5, 9, 10, 11)), '2025-06-16').currentStreak).toBe(4);
    });

    it('judges the first week when it starts on the first completion', () => {
      expect(streaks(h(june(2, 9, 10, 11)), '2025-06-16')).toEqual({ currentStreak: 3, longestStreak: 3 });
    });
  });

  describe('perPeriod month', () => {
    const h = (dates: string[]) => habit(dates, only({ type: 'perPeriod', period: 'month', count: 2 }, '2025-01-01'));

    it('counts completions while each month meets its target', () => {
      expect(streaks(h(['2025-01-05', '2025-01-20', '2025-02-03', '2025-02-10', '2025-03-01']), '2025-03-15').currentStreak).toBe(5);
    });

    it('breaks when a finished month falls short', () => {
      const result = streaks(h(['2025-01-05', '2025-01-20', '2025-02-03', '2025-03-01', '2025-03-02']), '2025-03-15');
      expect(result).toEqual({ currentStreak: 2, longestStreak: 3 });
    });
  });

  describe('afterLast', () => {
    const h = (dates: string[], days = 3) => habit(dates, only({ type: 'afterLast', days }));

    it('keeps the run while every gap is within the limit', () => {
      expect(streaks(h(june(1, 4, 7)), '2025-06-09').currentStreak).toBe(3);
    });

    it('is still alive on the deadline day itself', () => {
      expect(streaks(h(june(1)), '2025-06-04').currentStreak).toBe(1);
    });

    it('breaks once the deadline passes', () => {
      expect(streaks(h(june(1)), '2025-06-05')).toEqual({ currentStreak: 0, longestStreak: 1 });
      expect(streaks(h(june(1, 5)), '2025-06-06')).toEqual({ currentStreak: 1, longestStreak: 1 });
    });

    it('with a 1-day limit behaves like daily', () => {
      expect(streaks(h(june(1, 2, 3), 1), '2025-06-04').currentStreak).toBe(3);
      expect(streaks(h(june(1, 2, 3), 1), '2025-06-05').currentStreak).toBe(0);
    });
  });

  describe('schedule changes', () => {
    it('judges past days by the schedule in effect then', () => {
      const dates = june(2, 4, 6, 9, 11);
      const withHistory = habit(dates, [
        { from: '2025-06-01', schedule: { type: 'daily' } },
        { from: '2025-06-09', schedule: { type: 'weekdays', days: MWF } },
      ]);
      // Daily until Jun 8, so the missed Tue/Thu/Sat before the change still count as misses.
      expect(streaks(withHistory, '2025-06-12')).toEqual({ currentStreak: 2, longestStreak: 2 });
      // Without history the whole past would be reinterpreted as Mon/Wed/Fri.
      expect(streaks(habit(dates, only({ type: 'weekdays', days: MWF })), '2025-06-12').currentStreak).toBe(5);
    });

    // Change on Thursday Jun 12, splitting the week of Jun 9–15.
    const midWeek: ScheduleEntry[] = [
      { from: '2025-06-02', schedule: { type: 'perPeriod', period: 'week', count: 3 } },
      { from: '2025-06-12', schedule: { type: 'perPeriod', period: 'week', count: 2 } },
    ];

    it('does not break on the partial weeks on either side of a mid-week change', () => {
      expect(streaks(habit(june(2, 3, 4, 9, 13, 17, 18), midWeek), '2025-06-23').currentStreak).toBe(7);
    });

    it('still judges full weeks after a change', () => {
      expect(streaks(habit(june(2, 3, 4, 13, 17), midWeek), '2025-06-23')).toEqual({ currentStreak: 0, longestStreak: 5 });
    });

    it('treats a change on a period boundary as a full period', () => {
      const h = habit(june(2, 3, 4, 10), [
        { from: '2025-06-02', schedule: { type: 'perPeriod', period: 'week', count: 3 } },
        { from: '2025-06-09', schedule: { type: 'perPeriod', period: 'week', count: 2 } },
      ]);
      expect(streaks(h, '2025-06-16')).toEqual({ currentStreak: 0, longestStreak: 4 });
    });

    it('starts afterLast with a fresh window on the change date', () => {
      const h = habit(june(2, 7), [
        { from: '2025-06-01', schedule: { type: 'perPeriod', period: 'week', count: 1 } },
        { from: '2025-06-05', schedule: { type: 'afterLast', days: 3 } },
      ]);
      // Window opens Jun 5 with a deadline of Jun 7, although Jun 2 → Jun 7 is a 5-day gap.
      expect(streaks(h, '2025-06-08').currentStreak).toBe(2);
      expect(streaks(habit(june(2), h.schedules), '2025-06-08')).toEqual({ currentStreak: 0, longestStreak: 1 });
    });

    it('anchors an interval on the change date', () => {
      const schedules: ScheduleEntry[] = [
        { from: '2025-06-01', schedule: { type: 'daily' } },
        { from: '2025-06-05', schedule: { type: 'interval', every: 3 } },
      ];
      // Due on 5, 8, 11 after the change.
      expect(streaks(habit(june(1, 2, 3, 4, 5, 8), schedules), '2025-06-10').currentStreak).toBe(6);
      expect(streaks(habit(june(1, 2, 3, 4, 6, 8), schedules), '2025-06-10')).toEqual({ currentStreak: 2, longestStreak: 4 });
    });

    it('can switch back to daily', () => {
      const h = habit(june(2, 4, 9, 10), [
        { from: '2025-06-01', schedule: { type: 'weekdays', days: MWF } },
        { from: '2025-06-09', schedule: { type: 'daily' } },
      ]);
      // Fri Jun 6 was missed under Mon/Wed/Fri.
      expect(streaks(h, '2025-06-11')).toEqual({ currentStreak: 2, longestStreak: 2 });
    });
  });

  describe('timezones', () => {
    const originalTZ = process.env.TZ;
    afterEach(() => {
      if (originalTZ === undefined) delete process.env.TZ;
      else process.env.TZ = originalTZ;
    });

    it.each(['America/New_York', 'Asia/Kolkata', 'Pacific/Auckland'])(
      'counts days across a DST change in %s',
      (tz) => {
        process.env.TZ = tz;
        const us = habit(['2025-03-08', '2025-03-09', '2025-03-10', '2025-03-11']);
        expect(streaks(us, '2025-03-11').currentStreak).toBe(4);
        const nz = habit(['2025-04-05', '2025-04-06', '2025-04-07']);
        expect(streaks(nz, '2025-04-07').currentStreak).toBe(3);
        const weekly = habit(['2025-03-03', '2025-03-04', '2025-03-05', '2025-03-10'], only({ type: 'perPeriod', period: 'week', count: 3 }, '2025-03-02'));
        expect(streaks(weekly, '2025-03-15').currentStreak).toBe(4);
      },
    );
  });
});

describe('getDueInfo', () => {
  const thu = '2025-06-12';

  it('daily: due until done', () => {
    expect(getDueInfo(habit([]), thu)).toEqual({ status: 'due', nextDue: thu });
    expect(getDueInfo(habit([thu]), thu)).toEqual({ status: 'done', nextDue: '2025-06-13' });
  });

  it('weekdays: upcoming on unscheduled days, due on scheduled ones', () => {
    const schedules = only({ type: 'weekdays', days: MWF });
    expect(getDueInfo(habit([], schedules), thu)).toEqual({ status: 'upcoming', nextDue: '2025-06-13' });
    expect(getDueInfo(habit([], schedules), '2025-06-13')).toEqual({ status: 'due', nextDue: '2025-06-13' });
    expect(getDueInfo(habit(['2025-06-13'], schedules), '2025-06-13')).toEqual({ status: 'done', nextDue: '2025-06-16' });
    expect(getDueInfo(habit([thu], schedules), thu)).toEqual({ status: 'done', nextDue: '2025-06-13' });
  });

  it('weekdays: never due with an empty mask', () => {
    expect(getDueInfo(habit([], only({ type: 'weekdays', days: 0 })), thu)).toEqual({ status: 'upcoming', nextDue: null });
  });

  it('interval: next grid day', () => {
    expect(getDueInfo(habit([], only({ type: 'interval', every: 3 })), thu)).toEqual({ status: 'upcoming', nextDue: '2025-06-13' });
    expect(getDueInfo(habit([], only({ type: 'interval', every: 3 })), '2025-06-13')).toEqual({ status: 'due', nextDue: '2025-06-13' });
  });

  it('monthDay: clamps to the end of the month', () => {
    expect(getDueInfo(habit([], only({ type: 'monthDay', day: 31 })), thu)).toEqual({ status: 'upcoming', nextDue: '2025-06-30' });
    expect(getDueInfo(habit([], only({ type: 'monthDay', day: 31 })), '2025-06-30')).toEqual({ status: 'due', nextDue: '2025-06-30' });
  });

  it('perPeriod: reports completions still needed this period', () => {
    const schedules = only({ type: 'perPeriod', period: 'week', count: 3 });
    // Jun 1 belongs to the previous week.
    expect(getDueInfo(habit(june(1, 10), schedules), thu)).toEqual({ status: 'due', nextDue: thu, remaining: 2 });
    expect(getDueInfo(habit(june(9, 10, 11), schedules), thu)).toEqual({ status: 'done', nextDue: '2025-06-16', remaining: 0 });
    // Sunday Jun 8 is last week and Jun 13 is in the future.
    expect(getDueInfo(habit(june(8, 9, 10, 13), schedules), thu)).toEqual({ status: 'due', nextDue: thu, remaining: 1 });
  });

  it('perPeriod: only counts completions since a mid-period change', () => {
    const schedules: ScheduleEntry[] = [
      { from: '2025-06-01', schedule: { type: 'perPeriod', period: 'week', count: 3 } },
      { from: '2025-06-11', schedule: { type: 'perPeriod', period: 'week', count: 2 } },
    ];
    expect(getDueInfo(habit(june(8, 9, 10), schedules), thu)).toEqual({ status: 'due', nextDue: thu, remaining: 2 });
  });

  it('perPeriod month', () => {
    const schedules = only({ type: 'perPeriod', period: 'month', count: 2 });
    expect(getDueInfo(habit(june(2, 5), schedules), thu)).toEqual({ status: 'done', nextDue: '2025-07-01', remaining: 0 });
  });

  describe('afterLast', () => {
    const schedules = only({ type: 'afterLast', days: 3 });

    it('is due when never completed', () => {
      expect(getDueInfo(habit([], schedules), thu)).toEqual({ status: 'due', nextDue: thu });
    });

    it('moves from upcoming to due to overdue', () => {
      const h = habit(june(10), schedules);
      expect(getDueInfo(h, thu)).toEqual({ status: 'upcoming', nextDue: '2025-06-13' });
      expect(getDueInfo(h, '2025-06-13')).toEqual({ status: 'due', nextDue: '2025-06-13' });
      expect(getDueInfo(h, '2025-06-15')).toEqual({ status: 'overdue', nextDue: '2025-06-13' });
    });

    it('resets the clock on completion', () => {
      expect(getDueInfo(habit(june(10, 12), schedules), thu)).toEqual({ status: 'done', nextDue: '2025-06-15' });
    });

    it('counts from the change date when switched mid-way', () => {
      const h = habit(june(1), [
        { from: '2025-06-01', schedule: { type: 'daily' } },
        { from: '2025-06-11', schedule: { type: 'afterLast', days: 3 } },
      ]);
      expect(getDueInfo(h, thu)).toEqual({ status: 'upcoming', nextDue: '2025-06-13' });
    });
  });
});

describe('date keys that are not real days', () => {
  // Validation keeps these out, but a stray key must not take the whole page down.
  const habit: Habit = { id: 1, name: 'Walk', dates: { '2025-02-30': true, '2025-03-01': true, '2025-03-02': true } };

  it('ignores them when counting streaks', () => {
    expect(calculateScheduledStreaks(habit, '2025-03-02')).toEqual({ currentStreak: 2, longestStreak: 2 });
  });

  it('does not start a schedule history from them', () => {
    const history = setSchedule(habit, { type: 'interval', every: 2 }, '2025-03-05');
    expect(history[0]).toEqual({ from: '2025-03-01', schedule: { type: 'daily' } });
  });
});

describe('countExpectedCheckIns', () => {
  // Mon 9 Jun – Sun 15 Jun 2025.
  const week = ['2025-06-09', '2025-06-10', '2025-06-11', '2025-06-12', '2025-06-13', '2025-06-14', '2025-06-15'];
  const withSchedule = (schedule: Schedule, from = '2025-01-01'): Habit => ({
    id: 1,
    name: 'H',
    dates: {},
    schedules: [{ from, schedule }],
  });

  it('expects a daily habit every day', () => {
    expect(countExpectedCheckIns({ id: 1, name: 'H', dates: {} }, week)).toBe(7);
  });

  it('expects only the chosen weekdays', () => {
    expect(countExpectedCheckIns(withSchedule({ type: 'weekdays', days: MWF }), week)).toBe(3);
  });

  it('expects the weekly target for a times-a-week habit', () => {
    expect(countExpectedCheckIns(withSchedule({ type: 'perPeriod', period: 'week', count: 3 }), week)).toBe(3);
  });

  it('expects a week\'s share of a monthly target', () => {
    // 12 a month in a 30-day month is 2.8 a week.
    expect(countExpectedCheckIns(withSchedule({ type: 'perPeriod', period: 'month', count: 12 }), week)).toBe(3);
  });

  it('expects the due days of a fixed cycle', () => {
    // Every 3 days from 9 Jun: 9, 12, 15.
    expect(countExpectedCheckIns(withSchedule({ type: 'interval', every: 3 }, '2025-06-09'), week)).toBe(3);
  });

  it('expects one check-in per allowed gap for within-N-days habits', () => {
    expect(countExpectedCheckIns(withSchedule({ type: 'afterLast', days: 2 }), week)).toBe(4); // 3.5
    expect(countExpectedCheckIns(withSchedule({ type: 'afterLast', days: 7 }), week)).toBe(1);
  });

  it('expects a day of the month only when it falls in the window', () => {
    expect(countExpectedCheckIns(withSchedule({ type: 'monthDay', day: 12 }), week)).toBe(1);
    expect(countExpectedCheckIns(withSchedule({ type: 'monthDay', day: 20 }), week)).toBe(0);
  });

  it('judges each day by the schedule in effect on it', () => {
    const habit: Habit = {
      id: 1,
      name: 'H',
      dates: {},
      schedules: [
        { from: '2025-01-01', schedule: { type: 'daily' } },
        { from: '2025-06-12', schedule: { type: 'weekdays', days: MWF } },
      ],
    };
    // Daily on 9, 10, 11, then only Fri 13.
    expect(countExpectedCheckIns(habit, week)).toBe(4);
  });
});
