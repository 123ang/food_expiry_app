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
 * Add days to a date in GMT+8 timezone
 */
export const addDaysToDate = (date: string, days: number): string => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return toGMT8DateString(d);
};

/**
 * Format date string to locale date string (for display)
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-SG', { timeZone: 'Asia/Singapore' });
};

/**
 * Calculate days until expiry date (using GMT+8)
 */
export const calculateDaysUntilExpiry = (expiryDate: string): number => {
  const today = new Date();
  // Get today's date in GMT+8 (add 8 hours, then set to midnight)
  const todayGMT8 = new Date(today.getTime() + (8 * 60 * 60 * 1000));
  todayGMT8.setUTCHours(0, 0, 0, 0);
  
  // Parse expiry date and set to midnight in GMT+8
  const expiry = new Date(expiryDate + 'T00:00:00Z');
  const expiryGMT8 = new Date(expiry.getTime() + (8 * 60 * 60 * 1000));
  expiryGMT8.setUTCHours(0, 0, 0, 0);
  
  const diffTime = expiryGMT8.getTime() - todayGMT8.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Get a Date object representing current time in GMT+8
 */
export const getCurrentDateGMT8 = (): Date => {
  const now = new Date();
  // Add 8 hours to get GMT+8 time
  return new Date(now.getTime() + (8 * 60 * 60 * 1000));
};
