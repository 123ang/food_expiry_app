import React from 'react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  benefit: string;
  description: string;
  index?: number;
  variant?: 'green' | 'teal';
}

const FeatureCard: React.FC<FeatureCardProps> = ({
  icon,
  title,
  benefit,
  description,
  index = 0,
  variant = 'green',
}) => {
  const id = `feature-${title.replace(/\s+/g, '-').toLowerCase()}`;
  return (
    <article
      className={`lp-feature-card lp-feature-card--${variant}`}
      data-index={index}
      aria-labelledby={id}
    >
      <div className="lp-feature-card__accent" aria-hidden="true" />
      <div className="lp-feature-card__icon" aria-hidden="true">
        <span className="lp-feature-card__icon-inner">{icon}</span>
      </div>
      <h3 id={id} className="lp-feature-card__title">
        {title}
      </h3>
      {benefit && benefit !== description && <p className="lp-feature-card__benefit">{benefit}</p>}
      <p className="lp-feature-card__desc">{description}</p>
    </article>
  );
};

export default FeatureCard;
