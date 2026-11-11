import { Schedule } from '../types';
import { diffCalendarDaysLocal, parseLocalDateString } from './dateUtils';
import { DueInfo } from './scheduleUtils';

/** Weekdays in display order (Monday first), as `Date.getDay()` numbers. */
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export const WEEKDAY_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;

export const WEEKDAYS_MASK = 0b0111110; // Mon–Fri
export const WEEKENDS_MASK = 0b1000001; // Sat, Sun
export const ALL_DAYS_MASK = 0b1111111;

export const ordinal = (n: number): string => {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
};

const times = (count: number): string =>
  count === 1 ? 'Once' : count === 2 ? 'Twice' : `${count} times`;

const plural = (n: number, unit: string): string => `${n} ${unit}${n === 1 ? '' : 's'}`;

/** Short, human description of a schedule, e.g. "Mon, Wed, Fri" or "3 times a week". */
export const describeSchedule = (schedule: Schedule): string => {
  switch (schedule.type) {
    case 'daily':
      return 'Every day';
    case 'weekdays':
      if (schedule.days === ALL_DAYS_MASK) return 'Every day';
      if (schedule.days === WEEKDAYS_MASK) return 'Weekdays';
      if (schedule.days === WEEKENDS_MASK) return 'Weekends';
      return WEEKDAY_ORDER.filter((d) => (schedule.days >> d) & 1)
        .map((d) => WEEKDAY_SHORT[d])
        .join(', ');
    case 'perPeriod':
      return `${times(schedule.count)} a ${schedule.period}`;
    case 'interval':
      return schedule.every === 1 ? 'Every day' : `Every ${schedule.every} days`;
    case 'afterLast':
      return `Within ${plural(schedule.days, 'day')} of last time`;
    case 'monthDay':
      if (schedule.day === 31) return 'Last day of each month';
      if (schedule.day >= 29) return `The ${ordinal(schedule.day)} of each month, or the last day`;
      return `The ${ordinal(schedule.day)} of each month`;
  }
};

/** "tomorrow", a weekday name within the next week, or a short date such as "30 Jun". */
export const formatUpcomingDay = (date: string, today: string): string => {
  const days = diffCalendarDaysLocal(today, date);
  const d = parseLocalDateString(date);
  if (days === null || !d) return date;
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days > 1 && days < 7) return WEEKDAY_LONG[d.getDay()];
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

/** One-line status for a habit card, e.g. "Due today", "2 more this week", "Next: Friday". */
export const describeDue = (info: DueInfo, schedule: Schedule, today: string): string => {
  const period = schedule.type === 'perPeriod' ? schedule.period : null;
  switch (info.status) {
    case 'due':
      return period ? `${info.remaining} more this ${period}` : 'Due today';
    case 'done':
      return period ? `Done this ${period}` : 'Done for today';
    case 'overdue': {
      const late = info.nextDue ? diffCalendarDaysLocal(info.nextDue, today) : null;
      return late && late > 0 ? `${plural(late, 'day')} overdue` : 'Overdue';
    }
    case 'upcoming':
      return info.nextDue ? `Next: ${formatUpcomingDay(info.nextDue, today)}` : 'Not scheduled';
  }
};
