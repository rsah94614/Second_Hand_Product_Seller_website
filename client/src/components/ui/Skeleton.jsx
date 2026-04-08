import React from 'react';

export function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animate = true,
}) {
  const baseClass = 'bg-gray-200/80';
  const animationClass = animate ? 'animate-pulse' : '';
  
  const variants = {
    rectangular: 'rounded-md',
    circular: 'rounded-full',
    text: 'rounded max-w-full',
  };

  const style = {
    width: width || (variant === 'text' ? '100%' : undefined),
    height: height || (variant === 'text' ? '1rem' : undefined),
  };

  return (
    <div
      className={`${baseClass} ${animationClass} ${variants[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}
