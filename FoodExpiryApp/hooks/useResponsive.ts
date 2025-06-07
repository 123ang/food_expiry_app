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

  // Calculate breakpoints
  const breakpoints: ResponsiveBreakpoints = {
    isSmall: dimensions.width < 360,
    isMedium: dimensions.width >= 360 && dimensions.width < 414,
    isLarge: dimensions.width >= 414 && dimensions.width < 480,
    isXLarge: dimensions.width >= 480,
    isTablet: dimensions.width >= 600,
    isLandscape: dimensions.width > dimensions.height,
    isPortrait: dimensions.height > dimensions.width,
  };

  // Calculate grid columns first
  const gridColumns = {
    categories: breakpoints.isSmall ? 1 : breakpoints.isTablet ? 4 : 2,
    locations: breakpoints.isSmall ? 1 : breakpoints.isTablet ? 3 : 2,
    stats: breakpoints.isSmall ? 1 : breakpoints.isLarge ? 4 : breakpoints.isMedium ? 2 : 2,
  };

  // Calculate responsive layout values
  const layout: ResponsiveLayout = {
    gridColumns,
    spacing: {
      container: breakpoints.isSmall ? 12 : breakpoints.isTablet ? 24 : 16,
      card: breakpoints.isSmall ? 12 : breakpoints.isTablet ? 20 : 16,
      grid: breakpoints.isSmall ? 8 : breakpoints.isTablet ? 16 : 12,
    },
    fontSize: {
      small: breakpoints.isSmall ? 12 : 14,
      medium: breakpoints.isSmall ? 14 : 16,
      large: breakpoints.isSmall ? 16 : 18,
      xlarge: breakpoints.isSmall ? 20 : breakpoints.isTablet ? 28 : 24,
    },
    cardSize: {
      width: breakpoints.isSmall ? '100%' : 
             breakpoints.isTablet ? `${(100 / gridColumns.categories) - 2}%` :
             `${(100 / gridColumns.categories) - 1}%`,
      minHeight: breakpoints.isSmall ? 100 : breakpoints.isTablet ? 140 : 120,
    },
  };

  // Helper functions
  const getResponsiveValue = <T>(values: {
    small?: T;
    medium?: T;
    large?: T;
    xlarge?: T;
    tablet?: T;
    default: T;
  }): T => {
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

  // Device-specific optimizations
  const deviceOptimizations = {
    // Huawei Mate series typically have larger screens (6.5"+ with ~414-428px width)
    isHuaweiMateSize: dimensions.width >= 414 && dimensions.width <= 428 && dimensions.height >= 800,
    // iPhone sizes
    isIPhoneSize: dimensions.width >= 375 && dimensions.width <= 414,
    // Small Android phones
    isSmallAndroid: dimensions.width < 360,
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