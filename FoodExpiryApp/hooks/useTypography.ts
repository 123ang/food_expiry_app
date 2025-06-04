import { useMemo } from 'react';
import { getTypography, CURRENT_FONT_FAMILY, FONT_FAMILIES } from '../styles/typography';
import { useLanguage } from '../context/LanguageContext';

export const useTypography = (fontFamily?: keyof typeof FONT_FAMILIES) => {
  const { language } = useLanguage();
  
  const typography = useMemo(() => {
    return getTypography(fontFamily || CURRENT_FONT_FAMILY, language);
  }, [fontFamily, language]);

  return typography;
}; 