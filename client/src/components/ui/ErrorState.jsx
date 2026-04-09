import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

/**
 * ErrorState — shown when an API call fails.
 * Use this instead of ad-hoc inline error text across pages.
 */
export function ErrorState({
  title = 'Something went wrong',
  description = 'We could not load this content. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-10 text-center bg-white rounded-2xl shadow-sm border border-red-50 ${className}`}
    >
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-500 max-w-sm mx-auto mb-6">{description}</p>
      )}
      {onRetry && (
        <Button variant="outline" onClick={onRetry} className="min-w-[150px] gap-2">
          <RefreshCw className="w-4 h-4" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
}
