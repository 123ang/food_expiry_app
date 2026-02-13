import React from 'react';

interface StepCardProps {
  step: number;
  title: string;
  description: string;
}

const StepCard: React.FC<StepCardProps> = ({ step, title, description }) => (
  <article className="lp-step-card lp-step-card--timeline" aria-labelledby={`step-${step}-title`}>
    <div className="lp-step-card__number" aria-hidden="true">
      {step}
    </div>
    <div className="lp-step-card__body">
      <h3 id={`step-${step}-title`} className="lp-step-card__title">
        {title}
      </h3>
      <p className="lp-step-card__desc">{description}</p>
    </div>
  </article>
);

export default StepCard;
