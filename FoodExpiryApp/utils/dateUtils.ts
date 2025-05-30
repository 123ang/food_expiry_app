/**
 * Utility functions for date handling in the Food Expiry App
 */

/**
 * Format a date string or Date object to a human-readable format
 * @param date Date string or Date object
 * @returns Formatted date string (e.g., "Jan 15, 2023")
 */
export const formatDate = (date: string | Date): string => {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return 'Invalid date';
  
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/**
 * Calculate the number of days until a date (negative if date is in the past)
 * @param date Date string or Date object
 * @returns Number of days until the date
 */
export const getDaysUntilExpiry = (date: string | Date): number => {
  if (!date) return 0;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return 0;
  
  // Set both dates to midnight for accurate day calculation
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const expiryDate = new Date(dateObj);
  expiryDate.setHours(0, 0, 0, 0);
  
  // Calculate difference in days
  const diffTime = expiryDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};