import React from 'react';
import { Link } from 'react-router-dom';

type ButtonVariant = 'primary' | 'secondary';
type ButtonSize = 'md' | 'lg';

interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string;
  href?: string;
  to?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  href,
  to,
}) => {
  const classes = ['lp-btn', `lp-btn--${variant}`, `lp-btn--${size}`, className].filter(Boolean).join(' ');

  if (to) {
    return <Link to={to} className={classes}>{children}</Link>;
  }

  return (
    <a href={href || '#download'} className={classes}>
      {children}
    </a>
  );
};

export default Button;
