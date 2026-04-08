import React from 'react';
import { Button } from './Button';

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}>
      {Icon && (
        <div className="w-16 h-16 bg-primary-50 text-primary-500 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 max-w-sm mx-auto mb-6">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="min-w-[150px]">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
