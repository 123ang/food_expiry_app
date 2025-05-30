/**
 * Utility functions for handling food item status in the Food Expiry App
 */

/**
 * Get the color for a food item status
 * @param status The status of the food item ('expired', 'expiring_soon', or 'fresh')
 * @param colors The theme colors object
 * @returns The color for the status
 */
export const getStatusColor = (
  status: 'expired' | 'expiring_soon' | 'fresh', 
  colors: { 
    danger: string; 
    warning: string; 
    success: string; 
  }
): string => {
  switch (status) {
    case 'expired':
      return colors.danger;
    case 'expiring_soon':
      return colors.warning;
    case 'fresh':
      return colors.success;
    default:
      return colors.success;
  }
};

/**
 * Get the display name for a food item status
 * @param status The status of the food item ('expired', 'expiring_soon', or 'fresh')
 * @returns The display name for the status
 */
export const getStatusName = (status: 'expired' | 'expiring_soon' | 'fresh'): string => {
  switch (status) {
    case 'expired':
      return 'Expired';
    case 'expiring_soon':
      return 'Expiring Soon';
    case 'fresh':
      return 'Fresh';
    default:
      return 'Fresh';
  }
};