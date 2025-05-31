import React from 'react';
import { Image, View } from 'react-native';
import { getLocationIcon } from '../utils/iconRegistry';

interface LocationIconProps {
  iconName: string | null | undefined;
  size?: number;
  backgroundColor?: string;
  borderRadius?: number;
}

export function LocationIcon({
  iconName,
  size = 24,
  backgroundColor,
  borderRadius,
}: LocationIconProps) {
  const iconSource = getLocationIcon(iconName);

  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: backgroundColor || 'transparent',
        borderRadius: borderRadius || 0,
      }}
    >
      <Image
        source={iconSource}
        style={{
          width: size * 0.8,
          height: size * 0.8,
          resizeMode: 'contain',
        }}
      />
    </View>
  );
} 