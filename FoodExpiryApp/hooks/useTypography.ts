import { useMemo } from 'react';
import { getTypography, CURRENT_FONT_FAMILY, FONT_FAMILIES } from '../styles/typography';

export const useTypography = (fontFamily?: keyof typeof FONT_FAMILIES) => {
  const typography = useMemo(() => {
    return getTypography(fontFamily || CURRENT_FONT_FAMILY);
  }, [fontFamily]);

  return typography;
}; 