/**
 * Calculates the day of the year (1-366) for a given local date.
 * This method is robust against timezone and DST issues.
 * @param date The local date object.
 * @returns The day of the year.
 */
export const getDayOfYear = (date: Date): number => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    // Normalize both dates to midnight to avoid DST-related time shifts
    startOfYear.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diff = date.getTime() - startOfYear.getTime();
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
