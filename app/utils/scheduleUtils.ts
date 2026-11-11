import { Habit, Schedule, ScheduleEntry } from '../types';
import { diffCalendarDaysLocal, getLocalDateString, parseLocalDateString } from './dateUtils';

export const DAILY: Schedule = { type: 'daily' };

// --- date helpers (all local calendar days as "YYYY-MM-DD") ---

const addDays = (iso: string, n: number): string => {
  const d = parseLocalDateString(iso);
  if (!d) throw new Error(`Invalid date: ${iso}`);
  d.setDate(d.getDate() + n);
  return getLocalDateString(d);
};

const daysInMonth = (year: number, monthIndex: number): number =>
  new Date(year, monthIndex + 1, 0).getDate();

const mod = (n: number, m: number): number => ((n % m) + m) % m;

/** Days since the start of the week; weeks start on Monday. */
const weekdayOffset = (date: Date): number => (date.getDay() + 6) % 7;

/** Calendar bounds of the week (Monday–Sunday) or month containing `date`. */
const calendarPeriod = (date: Date, period: 'week' | 'month'): { start: string; end: string } => {
  if (period === 'week') {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate() - weekdayOffset(date));
    const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
    return { start: getLocalDateString(start), end: getLocalDateString(end) };
  }
  const y = date.getFullYear();
  const m = date.getMonth();
  return {
    start: getLocalDateString(new Date(y, m, 1)),
    end: getLocalDateString(new Date(y, m, daysInMonth(y, m))),
  };
};

const maxStr = (a: string, b: string) => (a > b ? a : b);
const minStr = (a: string, b: string) => (a < b ? a : b);

// --- schedule history ---

export const schedulesEqual = (a: Schedule, b: Schedule): boolean => {
  switch (a.type) {
    case 'daily':
      return b.type === 'daily';
    case 'weekdays':
      return b.type === 'weekdays' && a.days === b.days;
    case 'perPeriod':
      return b.type === 'perPeriod' && a.period === b.period && a.count === b.count;
    case 'interval':
      return b.type === 'interval' && a.every === b.every;
    case 'afterLast':
      return b.type === 'afterLast' && a.days === b.days;
    case 'monthDay':
      return b.type === 'monthDay' && a.day === b.day;
  }
};

/** The habit's schedule history sorted by `from`. A habit with no history is daily. */
export const getScheduleHistory = (habit: Habit): ScheduleEntry[] => {
  if (!habit.schedules || habit.schedules.length === 0) {
    return [{ from: '0000-01-01', schedule: DAILY }];
  }
  return [...habit.schedules].sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : 0));
};

const segmentIndexOn = (history: ScheduleEntry[], date: string): number => {
  let i = 0;
  while (i + 1 < history.length && date >= history[i + 1].from) i++;
  return i;
};

/** The schedule in effect on `date`. */
export const getScheduleOn = (habit: Habit, date: string): Schedule => {
  const history = getScheduleHistory(habit);
  return history[segmentIndexOn(history, date)].schedule;
};

/**
 * Puts a schedule history into canonical form: sorted by `from`, one entry per day (the last one
 * wins), no entry that repeats the schedule before it, and an empty history for plain daily.
 */
export const normalizeScheduleHistory = (entries: ScheduleEntry[]): ScheduleEntry[] => {
  const byDay = new Map<string, ScheduleEntry>();
  for (const e of entries) byDay.set(e.from, e);
  const sorted = [...byDay.values()].sort((a, b) => (a.from < b.from ? -1 : a.from > b.from ? 1 : 0));
  const out: ScheduleEntry[] = [];
  for (const e of sorted) {
    const prev = out[out.length - 1];
    if (!prev || !schedulesEqual(prev.schedule, e.schedule)) out.push(e);
  }
  if (out.length === 1 && out[0].schedule.type === 'daily') return [];
  return out;
};

const earliestCompletion = (habit: Habit): string | null => {
  let earliest: string | null = null;
  for (const d of Object.keys(habit.dates)) {
    if (habit.dates[d] && (earliest === null || d < earliest)) earliest = d;
  }
  return earliest;
};

/**
 * Returns the habit's new schedule history after switching to `schedule` on `today`.
 * Past days keep the schedule that was in effect on them. Changing the schedule more than once
 * on the same day keeps only the last change, and changing back to the previous schedule
 * removes the change. Plain daily habits are represented by an empty history.
 */
export const setSchedule = (habit: Habit, schedule: Schedule, today: string): ScheduleEntry[] => {
  let history: ScheduleEntry[];
  if (habit.schedules && habit.schedules.length > 0) {
    history = getScheduleHistory(habit);
  } else {
    const earliest = earliestCompletion(habit);
    history = [{ from: earliest ? minStr(earliest, today) : today, schedule: DAILY }];
  }

  const kept = history.filter((e) => e.from < today);
  const previous = kept[kept.length - 1];
  const next = previous && schedulesEqual(previous.schedule, schedule)
    ? kept
    : [...kept, { from: today, schedule }];

  if (next.length === 1 && next[0].schedule.type === 'daily') return [];
  return next;
};

// --- strict "due on this exact day" schedules ---

const isStrictDueOn = (schedule: Schedule, date: Date, segmentFrom: string): boolean => {
  switch (schedule.type) {
    case 'daily':
      return true;
    case 'weekdays':
      return ((schedule.days >> date.getDay()) & 1) === 1;
    case 'interval': {
      const offset = diffCalendarDaysLocal(segmentFrom, getLocalDateString(date));
      return offset !== null && mod(offset, schedule.every) === 0;
    }
    case 'monthDay': {
      const dim = daysInMonth(date.getFullYear(), date.getMonth());
      return date.getDate() === Math.min(schedule.day, dim);
    }
    default:
      return false;
  }
};

// --- streaks ---

export type StreakResult = {
  currentStreak: number;
  longestStreak: number;
};

/**
 * Streaks count completions in an unbroken run. A run breaks when an obligation that has fully
 * passed (ended before `today`) was not met:
 * - daily / weekdays / interval / monthDay: a due day with no completion.
 * - perPeriod: a week or month with fewer than `count` completions. Periods cut short by a
 *   schedule change, or that began before the habit's first completion, never break a run.
 * - afterLast: more than `days` days passing without a completion.
 * A schedule change starts a fresh period on its date. Each day is judged by the schedule in
 * effect on it. Completions on days that are not due still count toward the run.
 */
export const calculateScheduledStreaks = (habit: Habit, today: string): StreakResult => {
  const completed = (d: string) => habit.dates[d] === true;
  const first = earliestCompletion(habit);
  if (!first || first > today) return { currentStreak: 0, longestStreak: 0 };

  const history = getScheduleHistory(habit);
  let run = 0;
  let longest = 0;
  const fail = () => {
    longest = Math.max(longest, run);
    run = 0;
  };

  let segIndex = -1;
  // perPeriod state
  let periodKey = '';
  let periodCount = 0;
  let periodEnd = '';
  let periodLenient = false;
  // afterLast state
  let lastRef: string | null = null;

  const cursor = parseLocalDateString(first)!;
  for (let d = first; d <= today; cursor.setDate(cursor.getDate() + 1), d = getLocalDateString(cursor)) {
    const idx = segmentIndexOn(history, d);
    const seg = history[idx];
    const isFirstSeg = idx === 0;
    const segEnd = idx + 1 < history.length ? addDays(history[idx + 1].from, -1) : null;
    if (idx !== segIndex) {
      segIndex = idx;
      periodKey = '';
      lastRef = isFirstSeg ? null : addDays(seg.from, -1);
    }

    const done = completed(d);
    if (done) run++;
    const past = d < today;
    const schedule = seg.schedule;

    if (schedule.type === 'perPeriod') {
      const cal = calendarPeriod(cursor, schedule.period);
      const key = cal.start;
      if (key !== periodKey) {
        periodKey = key;
        periodCount = 0;
        const start = isFirstSeg ? cal.start : maxStr(cal.start, seg.from);
        periodEnd = segEnd ? minStr(cal.end, segEnd) : cal.end;
        periodLenient = start !== cal.start || periodEnd !== cal.end || start < first;
      }
      if (done) periodCount++;
      if (past && d === periodEnd && !periodLenient && periodCount < schedule.count) fail();
    } else if (schedule.type === 'afterLast') {
      if (done) {
        lastRef = d;
      } else if (past && lastRef !== null) {
        const gap = diffCalendarDaysLocal(lastRef, d);
        if (gap !== null && gap >= schedule.days) {
          fail();
          lastRef = d;
        }
      }
    } else if (past && !done && isStrictDueOn(schedule, cursor, seg.from)) {
      fail();
    }
  }

  longest = Math.max(longest, run);
  return { currentStreak: run, longestStreak: longest };
};

// --- what is due today ---

export type DueStatus = 'done' | 'due' | 'upcoming' | 'overdue';

export type DueInfo = {
  status: DueStatus;
  /** Next day the habit is due: today if due now, a past day if overdue, null if never. */
  nextDue: string | null;
  /** perPeriod only: completions still needed in the current week or month. */
  remaining?: number;
};

const MAX_LOOKAHEAD_DAYS = 400;

export const getDueInfo = (habit: Habit, today: string): DueInfo => {
  const history = getScheduleHistory(habit);
  const idx = segmentIndexOn(history, today);
  const seg = history[idx];
  const isFirstSeg = idx === 0;
  const schedule = seg.schedule;
  const doneToday = habit.dates[today] === true;
  const todayDate = parseLocalDateString(today);
  if (!todayDate) throw new Error(`Invalid date: ${today}`);

  if (schedule.type === 'perPeriod') {
    const cal = calendarPeriod(todayDate, schedule.period);
    const start = isFirstSeg ? cal.start : maxStr(cal.start, seg.from);
    let count = 0;
    for (const d of Object.keys(habit.dates)) {
      if (habit.dates[d] && d >= start && d <= today) count++;
    }
    const remaining = Math.max(0, schedule.count - count);
    return remaining === 0
      ? { status: 'done', nextDue: addDays(cal.end, 1), remaining }
      : { status: 'due', nextDue: today, remaining };
  }

  if (schedule.type === 'afterLast') {
    let ref: string | null = isFirstSeg ? null : addDays(seg.from, -1);
    for (const d of Object.keys(habit.dates)) {
      if (habit.dates[d] && d <= today && (isFirstSeg || d >= seg.from) && (ref === null || d > ref)) {
        ref = d;
      }
    }
    if (ref === null) return { status: 'due', nextDue: today };
    const deadline = addDays(ref, schedule.days);
    if (doneToday) return { status: 'done', nextDue: deadline };
    if (today < deadline) return { status: 'upcoming', nextDue: deadline };
    if (today === deadline) return { status: 'due', nextDue: today };
    return { status: 'overdue', nextDue: deadline };
  }

  const dueToday = isStrictDueOn(schedule, todayDate, seg.from);
  if (dueToday && !doneToday) return { status: 'due', nextDue: today };

  let nextDue: string | null = null;
  const probe = new Date(todayDate.getTime());
  for (let i = 0; i < MAX_LOOKAHEAD_DAYS; i++) {
    probe.setDate(probe.getDate() + 1);
    if (isStrictDueOn(schedule, probe, seg.from)) {
      nextDue = getLocalDateString(probe);
      break;
    }
  }
  return { status: doneToday ? 'done' : 'upcoming', nextDue };
};
