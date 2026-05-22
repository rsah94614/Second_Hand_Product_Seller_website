import React from 'react';
import { ArrowRight } from 'lucide-react';
import { formatCurrency } from '../../../lib/formatting';
import { Skeleton } from '../../../components/ui/Skeleton';

export function TopItemsWidget({
  title,
  items,
  loading = false,
  onViewAll,
  valueFormatter = (v) => formatCurrency(v),
}) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-gray-900">{title}</p>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
          >
            View All
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-gray-500">No data available</p>
        </div>
      ) : (
        <div className="space-y-0 divide-y divide-gray-100">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 flex-shrink-0">
                <span className="text-xs font-semibold text-blue-600">{item.rank}</span>
              </div>

              {item.icon && (
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 flex-shrink-0">
                  <item.icon className="w-4 h-4 text-gray-600" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                {item.subtitle && (
                  <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                )}
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-sm font-semibold text-gray-900">
                  {valueFormatter(item.value)}
                </p>
                {item.valueLabel && (
                  <p className="text-xs text-gray-500">{item.valueLabel}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
