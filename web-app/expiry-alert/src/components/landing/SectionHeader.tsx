import React from 'react';

interface SectionHeaderProps {
  id?: string;
  title: string;
  subtitle?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ id, title, subtitle }) => (
  <header className="lp-section-header">
    <h2 id={id} className="lp-section-header__title">{title}</h2>
    {subtitle && <p className="lp-section-header__subtitle">{subtitle}</p>}
  </header>
);

export default SectionHeader;
