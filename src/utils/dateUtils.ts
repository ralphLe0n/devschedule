/**
 * Date utility functions using date-fns
 */

import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  subDays,
  subWeeks,
  subMonths,
  subYears,
  isWithinInterval,
  parseISO,
  isSameDay,
  differenceInDays,
  differenceInCalendarDays,
} from 'date-fns';

export type ViewMode = 'year' | 'month' | 'week';

/**
 * Format a date as ISO string (YYYY-MM-DD)
 */
export const formatDateISO = (date: Date): string => {
  return format(date, 'yyyy-MM-dd');
};

/**
 * Parse ISO date string to Date object
 */
export const parseDateISO = (dateString: string): Date => {
  return parseISO(dateString);
};

/**
 * Get the date range for a given view mode and current date
 */
export const getViewDateRange = (date: Date, viewMode: ViewMode) => {
  switch (viewMode) {
    case 'week':
      return {
        start: startOfWeek(date, { weekStartsOn: 1 }), // Monday
        end: endOfWeek(date, { weekStartsOn: 1 }),
      };
    case 'month':
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
      };
    case 'year':
      return {
        start: startOfYear(date),
        end: endOfYear(date),
      };
  }
};

/**
 * Get all days in a date range
 */
export const getDaysInRange = (startDate: Date, endDate: Date): Date[] => {
  return eachDayOfInterval({ start: startDate, end: endDate });
};

/**
 * Get all weeks in a date range
 */
export const getWeeksInRange = (startDate: Date, endDate: Date): Date[] => {
  return eachWeekOfInterval(
    { start: startDate, end: endDate },
    { weekStartsOn: 1 }
  );
};

/**
 * Get all months in a date range
 */
export const getMonthsInRange = (startDate: Date, endDate: Date): Date[] => {
  return eachMonthOfInterval({ start: startDate, end: endDate });
};

/**
 * Navigate to next period based on view mode
 */
export const navigateNext = (date: Date, viewMode: ViewMode): Date => {
  switch (viewMode) {
    case 'week':
      return addWeeks(date, 1);
    case 'month':
      return addMonths(date, 1);
    case 'year':
      return addYears(date, 1);
  }
};

/**
 * Navigate to previous period based on view mode
 */
export const navigatePrevious = (date: Date, viewMode: ViewMode): Date => {
  switch (viewMode) {
    case 'week':
      return subWeeks(date, 1);
    case 'month':
      return subMonths(date, 1);
    case 'year':
      return subYears(date, 1);
  }
};

/**
 * Check if a date is within a date range (inclusive)
 */
export const isDateInRange = (
  date: Date | string,
  startDate: Date | string,
  endDate: Date | string
): boolean => {
  const d = typeof date === 'string' ? parseDateISO(date) : date;
  const start = typeof startDate === 'string' ? parseDateISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseDateISO(endDate) : endDate;

  return isWithinInterval(d, { start, end });
};

/**
 * Check if two date ranges overlap
 */
export const doRangesOverlap = (
  range1Start: Date | string,
  range1End: Date | string,
  range2Start: Date | string,
  range2End: Date | string
): boolean => {
  const r1Start = typeof range1Start === 'string' ? parseDateISO(range1Start) : range1Start;
  const r1End = typeof range1End === 'string' ? parseDateISO(range1End) : range1End;
  const r2Start = typeof range2Start === 'string' ? parseDateISO(range2Start) : range2Start;
  const r2End = typeof range2End === 'string' ? parseDateISO(range2End) : range2End;

  return r1Start <= r2End && r1End >= r2Start;
};

/**
 * Get the number of days between two dates (inclusive)
 */
export const getDaysBetween = (startDate: Date | string, endDate: Date | string): number => {
  const start = typeof startDate === 'string' ? parseDateISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseDateISO(endDate) : endDate;
  return differenceInCalendarDays(end, start) + 1;
};

/**
 * Format date for display
 */
export const formatDisplayDate = (date: Date | string, formatString: string = 'MMM d, yyyy'): string => {
  const d = typeof date === 'string' ? parseDateISO(date) : date;
  return format(d, formatString);
};

/**
 * Check if two dates are the same day
 */
export const isSameDayCheck = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = typeof date1 === 'string' ? parseDateISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseDateISO(date2) : date2;
  return isSameDay(d1, d2);
};

export {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addDays,
  addWeeks,
  addMonths,
  subDays,
  subWeeks,
  subMonths,
};
