import { useMemo } from 'react';
import { getTypography, CURRENT_FONT_FAMILY, FONT_FAMILIES, getFontFamilyForLanguage } from '../styles/typography';

export const useTypography = (
  fontFamily?: keyof typeof FONT_FAMILIES,
  language?: 'en' | 'zh' | 'ja'
) => {
  const typography = useMemo(() => {
    return getTypography(fontFamily || CURRENT_FONT_FAMILY, language);
  }, [fontFamily, language]);
  
  return typography;
}; 