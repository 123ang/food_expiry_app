import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

interface ScreenDimensions {
  width: number;
  height: number;
}

interface ResponsiveBreakpoints {
  isSmall: boolean;      // < 360px width (small phones)
  isMedium: boolean;     // 360-414px width (standard phones, iPhone)
  isLarge: boolean;      // 414-480px width (large phones, Huawei Mate)
  isXLarge: boolean;     // > 480px width (tablets, landscape)
  isTablet: boolean;     // > 600px width (tablets)
  isLargeTablet: boolean; // > 900px width (large tablets like iPad Pro)
  isLandscape: boolean;  // width > height
  isPortrait: boolean;   // height > width
}

interface ResponsiveLayout {
  // Grid columns for different screen sizes
  gridColumns: {
    categories: number;
    locations: number;
    stats: number;
  };
  // Spacing and sizing
  spacing: {
    container: number;
    card: number;
    grid: number;
  };
  // Font sizes
  fontSize: {
    small: number;
    medium: number;
    large: number;
    xlarge: number;
  };
  // Card dimensions
  cardSize: {
    width: string | number;
    minHeight: number;
  };
}

export function useResponsive() {
  const [dimensions, setDimensions] = useState<ScreenDimensions>(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions({ width: window.width, height: window.height });
    });

    return () => subscription?.remove();
  }, []);

  // Calculate breakpoints with enhanced iPad support
  const breakpoints: ResponsiveBreakpoints = {
    isSmall: dimensions.width < 360,
    isMedium: dimensions.width >= 360 && dimensions.width < 414,
    isLarge: dimensions.width >= 414 && dimensions.width < 480,
    isXLarge: dimensions.width >= 480,
    isTablet: dimensions.width >= 600,
    isLargeTablet: dimensions.width >= 900, // iPad Pro and large tablets
    isLandscape: dimensions.width > dimensions.height,
    isPortrait: dimensions.height > dimensions.width,
  };

  // Enhanced grid columns calculation for better iPad layout
  const getOptimalColumns = () => {
    // For categories - optimize for visual hierarchy (max 4 per row to prevent text cutting)
    let categories: number;
    if (breakpoints.isLargeTablet) {
      categories = 4; // Max 4 cols for large tablets (prevents text cutting)
    } else if (breakpoints.isTablet) {
      categories = breakpoints.isLandscape ? 4 : 3; // Max 4 cols landscape, 3 portrait on regular tablets
    } else if (breakpoints.isXLarge) {
      categories = 3; // Large phones
    } else if (breakpoints.isLarge) {
      categories = 2; // Regular large phones
    } else {
      categories = breakpoints.isSmall ? 1 : 2; // Small to medium phones
    }

    // For locations - slightly fewer than categories for better proportions
    let locations: number;
    if (breakpoints.isLargeTablet) {
      locations = breakpoints.isLandscape ? 4 : 3;
    } else if (breakpoints.isTablet) {
      locations = breakpoints.isLandscape ? 4 : 3;
    } else if (breakpoints.isXLarge) {
      locations = 3;
    } else {
      locations = breakpoints.isLarge ? 2 : breakpoints.isSmall ? 1 : 2;
    }

    // For stats - optimize for dashboard view
    let stats: number;
    if (breakpoints.isLargeTablet) {
      stats = 3; // Always 3 for tablets (looks best)
    } else if (breakpoints.isTablet) {
      stats = 3;
    } else if (breakpoints.isXLarge || breakpoints.isLarge) {
      stats = 3; // Fit all 3 stats in one row on larger phones
    } else {
      stats = breakpoints.isSmall ? 1 : 2; // Stack on very small screens
    }

    return { categories, locations, stats };
  };

  const gridColumns = getOptimalColumns();

  // Enhanced responsive layout values with tablet-optimized spacing
  const layout: ResponsiveLayout = {
    gridColumns,
    spacing: {
      container: breakpoints.isLargeTablet ? 32 : 
                breakpoints.isTablet ? 24 : 
                breakpoints.isSmall ? 12 : 16,
      card: breakpoints.isLargeTablet ? 24 : 
            breakpoints.isTablet ? 20 : 
            breakpoints.isSmall ? 12 : 16,
      grid: breakpoints.isLargeTablet ? 20 : 
            breakpoints.isTablet ? 16 : 
            breakpoints.isSmall ? 8 : 12,
    },
    fontSize: {
      small: breakpoints.isLargeTablet ? 16 : 
             breakpoints.isTablet ? 15 : 
             breakpoints.isSmall ? 12 : 14,
      medium: breakpoints.isLargeTablet ? 18 : 
              breakpoints.isTablet ? 17 : 
              breakpoints.isSmall ? 14 : 16,
      large: breakpoints.isLargeTablet ? 22 : 
             breakpoints.isTablet ? 20 : 
             breakpoints.isSmall ? 16 : 18,
      xlarge: breakpoints.isLargeTablet ? 32 : 
              breakpoints.isTablet ? 28 : 
              breakpoints.isSmall ? 20 : 24,
    },
    cardSize: {
      width: breakpoints.isSmall ? '100%' : 
             breakpoints.isTablet ? `${(100 / gridColumns.categories) - 2}%` :
             `${(100 / gridColumns.categories) - 1}%`,
      minHeight: breakpoints.isLargeTablet ? 160 : 
                 breakpoints.isTablet ? 140 : 
                 breakpoints.isSmall ? 100 : 120,
    },
  };

  // Helper functions
  const getResponsiveValue = <T>(values: {
    small?: T;
    medium?: T;
    large?: T;
    xlarge?: T;
    tablet?: T;
    largeTablet?: T;
    default: T;
  }): T => {
    if (breakpoints.isLargeTablet && values.largeTablet !== undefined) return values.largeTablet;
    if (breakpoints.isTablet && values.tablet !== undefined) return values.tablet;
    if (breakpoints.isXLarge && values.xlarge !== undefined) return values.xlarge;
    if (breakpoints.isLarge && values.large !== undefined) return values.large;
    if (breakpoints.isMedium && values.medium !== undefined) return values.medium;
    if (breakpoints.isSmall && values.small !== undefined) return values.small;
    return values.default;
  };

  const getGridItemWidth = (columns: number, gap: number = 12): number => {
    const gapTotal = (columns - 1) * gap;
    const availableWidth = dimensions.width - (2 * layout.spacing.container) - gapTotal;
    return availableWidth / columns;
  };

  // Enhanced device-specific optimizations
  const deviceOptimizations = {
    // Huawei Mate series typically have larger screens (6.5"+ with ~414-428px width)
    isHuaweiMateSize: dimensions.width >= 414 && dimensions.width <= 428 && dimensions.height >= 800,
    // iPhone sizes
    isIPhoneSize: dimensions.width >= 375 && dimensions.width <= 414,
    // Small Android phones
    isSmallAndroid: dimensions.width < 360,
    // iPad specific optimizations
    isIPadSize: dimensions.width >= 768, // Standard iPad size
    isIPadProSize: dimensions.width >= 1024, // iPad Pro size
    // Optimal layout suggestions
    shouldUseCompactLayout: breakpoints.isSmall || (breakpoints.isMedium && breakpoints.isPortrait),
    shouldUseExpandedLayout: breakpoints.isLargeTablet || (breakpoints.isTablet && breakpoints.isLandscape),
  };

  return {
    dimensions,
    breakpoints,
    layout,
    getResponsiveValue,
    getGridItemWidth,
    deviceOptimizations,
    // Convenience properties
    isWeb: Platform.OS === 'web',
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
  };
} 