import React from 'react';
import { useLanguage, Language } from '../contexts/LanguageContext';

interface LanguageSwitcherProps {
  className?: string;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className = '' }) => {
  const { language, setLanguage } = useLanguage();

  const languages: { code: Language; name: string; flag: string }[] = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'ja', name: '日本語', flag: '🇯🇵' }
  ];

  return (
    <div className={className || undefined} style={!className ? { position: 'relative', display: 'inline-block' } : undefined}>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        aria-label="Select language"
        style={!className ? {
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '0.5rem 0.75rem',
          fontSize: '0.875rem',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          minWidth: '100px'
        } : undefined}
      >
        {languages.map(lang => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher; 