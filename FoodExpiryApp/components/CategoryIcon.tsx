import React from 'react';
import { Image, StyleSheet, View, ViewStyle, ImageStyle } from 'react-native';
import { getCategoryIcon } from '../utils/iconRegistry';

interface CategoryIconProps {
  iconName: string | null | undefined;
  size?: number;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  backgroundColor?: string;
  borderRadius?: number;
}

export function CategoryIcon({
  iconName,
  size = 24,
  style,
  imageStyle,
  backgroundColor,
  borderRadius,
}: CategoryIconProps) {
  const iconSource = getCategoryIcon(iconName);

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: backgroundColor || 'transparent',
    borderRadius: borderRadius || 0,
    ...style,
  };

  const imgStyle: ImageStyle = {
    width: size * 0.8, // Slightly smaller than container for padding
    height: size * 0.8,
    resizeMode: 'contain',
    ...imageStyle,
  };

  return (
    <View style={containerStyle}>
      <Image source={iconSource} style={imgStyle} />
    </View>
  );
} 