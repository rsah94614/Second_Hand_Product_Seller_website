import React from 'react';
import { formatCurrency, formatPercentage, formatNumberWithSeparators } from '../../../lib/formatting';
import { Skeleton } from '../../../components/ui/Skeleton';

export function CategoryBreakdownWidget({
  title = 'Category Breakdown',
  categories,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-gray-900 mb-4">{title}</p>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-gray-900 mb-4">{title}</p>

      {categories.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500">No data available</p>
        </div>
      ) : (
        <div className="space-y-4 divide-y divide-gray-100">
          {categories.map((item, index) => (
            <div
              key={item.id || item._id || item.category || item.name || `category-item-${index}`}
              className="pt-4 first:pt-0"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-900">{item.name || item.category}</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(item.revenue)}
                </p>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-gray-100 rounded-full mb-2 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all"
                  style={{ width: `${Math.min(item.percentOfTotal, 100)}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                <div>
                  <p>{formatNumberWithSeparators(item.salesVolume, 0)} orders</p>
                </div>
                <div className="text-center">
                  <p>{formatPercentage(item.percentOfTotal, 1)} of total</p>
                </div>
                <div className="text-right">
                  <p>{item.activeSellers} sellers</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
