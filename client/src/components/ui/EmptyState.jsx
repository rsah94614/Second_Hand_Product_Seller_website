import React from 'react';
import { Button } from './Button';

/**
 * EmptyState — shown when a list, search result, or section has no items.
 * Use this instead of ad-hoc inline empty states across pages.
 *
 * Props:
 *  - icon: Lucide icon component
 *  - title: bold heading text (required)
 *  - description: supporting text
 *  - actionLabel: primary CTA label
 *  - onAction: primary CTA handler
 *  - secondaryActionLabel: secondary CTA label
 *  - secondaryOnAction: secondary CTA handler
 *  - className: extra classes for the wrapper
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  secondaryOnAction,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-10 text-center bg-white rounded-2xl border border-dashed border-gray-200 shadow-sm ${className}`}
    >
      {Icon && (
        <div className="w-16 h-16 bg-primary-50 text-primary-500 rounded-full flex items-center justify-center mb-4">
          <Icon className="w-8 h-8" />
        </div>
      )}
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 max-w-sm mx-auto mb-6 text-sm leading-relaxed">
          {description}
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        {actionLabel && onAction && (
          <Button onClick={onAction} className="min-w-[150px]">
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && secondaryOnAction && (
          <Button variant="outline" onClick={secondaryOnAction} className="min-w-[140px]">
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
