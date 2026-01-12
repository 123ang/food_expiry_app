/**
 * Date utility functions for GMT+8 timezone
 * All date operations use Asia/Singapore timezone (GMT+8)
 */

/**
 * Get current date/time in GMT+8 timezone as ISO string
 * This adds 8 hours to UTC time to get GMT+8 time
 */
export const getCurrentDateTimeISO = (): string => {
  const now = new Date();
  // Add 8 hours (GMT+8 offset) to current UTC time
  const gmt8Time = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  return gmt8Time.toISOString();
};

/**
 * Get current date in GMT+8 timezone as YYYY-MM-DD string
 */
export const getCurrentDate = (): string => {
  return getCurrentDateTimeISO().split('T')[0];
};

/**
 * Convert a date to GMT+8 timezone and return as ISO string
 * This adds 8 hours to the date to get GMT+8 time
 */
export const toGMT8ISO = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  // Add 8 hours (GMT+8 offset) to the date
  const gmt8Time = new Date(d.getTime() + (8 * 60 * 60 * 1000));
  return gmt8Time.toISOString();
};

/**
 * Convert a date to GMT+8 timezone and return as YYYY-MM-DD string
 */
export const toGMT8DateString = (date: Date | string): string => {
  return toGMT8ISO(date).split('T')[0];
};

/**
 * Calculate days until date (using GMT+8)
 */
export const daysUntil = (date: Date): number => {
  const now = new Date();
  // Get current time in GMT+8 (add 8 hours)
  const nowGMT8 = new Date(now.getTime() + (8 * 60 * 60 * 1000));
  nowGMT8.setUTCHours(0, 0, 0, 0);
  
  // Get target date in GMT+8 (add 8 hours)
  const targetGMT8 = new Date(date.getTime() + (8 * 60 * 60 * 1000));
  targetGMT8.setUTCHours(0, 0, 0, 0);
  
  const diff = targetGMT8.getTime() - nowGMT8.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * Format date to ISO string (YYYY-MM-DD) in GMT+8
 */
export const formatDate = (date: Date): string => {
  return toGMT8DateString(date);
};
