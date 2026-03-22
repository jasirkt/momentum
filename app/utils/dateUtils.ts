/**
 * Calculates the day of the year (1-366) for a given local date.
 * This method is robust against timezone and DST issues.
 * @param date The local date object.
 * @returns The day of the year.
 */
export const getDayOfYear = (date: Date): number => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const normalized = new Date(date.getTime());
    // Normalize both dates to midnight to avoid DST-related time shifts
    startOfYear.setHours(0, 0, 0, 0);
    normalized.setHours(0, 0, 0, 0);
    const diff = normalized.getTime() - startOfYear.getTime();
    // Use Math.round to handle potential floating point inaccuracies
    return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
};

/**
 * Creates a local date object from a year and a day of the year.
 * @param year The full year (e.g., 2025).
 * @param day The day of the year (1-366).
 * @returns A local date object, normalized to midnight.
 */
export const dateFromDay = (year: number, day: number): Date => {
    const date = new Date(year, 0); // Initialize a date in `year-01-01`
    date.setDate(day);
    date.setHours(0, 0, 0, 0); // Normalize to midnight local time
    return date;
};

/**
 * Formats a local date object into a "YYYY-MM-DD" string.
 * @param date The local date object.
 * @returns The formatted date string.
 */
export const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parses a YYYY-MM-DD string as a local calendar date at midnight (not UTC).
 * Returns null if the string is invalid or not a real calendar day.
 */
export const parseLocalDateString = (iso: string): Date | null => {
  const m = ISO_DATE.exec(iso);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) {
    return null;
  }
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * Whole calendar days from earlier to later (local), both YYYY-MM-DD.
 * Returns null if either string is invalid.
 */
export const diffCalendarDaysLocal = (earlier: string, later: string): number | null => {
  const a = parseLocalDateString(earlier);
  const b = parseLocalDateString(later);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * Generates an array of the last N days, including today.
 * @param numDays The number of days to get.
 * @returns An array of Date objects, sorted from oldest to newest.
 */
export const getPastDates = (numDays: number): Date[] => {
  const dates = [];
  for (let i = 0; i < numDays; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date);
  }
  return dates.reverse(); // Today on the far right
};
