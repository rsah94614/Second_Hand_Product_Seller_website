import React from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { getTrendColor, getTrendIndicator } from '../../../lib/formatting';
import { Skeleton } from '../../../components/ui/Skeleton';

export function MetricCard({
  title,
  value,
  icon: Icon,
  change,
  changeLabel = 'vs last period',
  loading = false,
}) {
  const trend = change !== undefined ? getTrendIndicator(change) : null;
  const trendColor = trend ? getTrendColor(change) : '';

  const getTrendIcon = () => {
    if (trend === 'up') return <ArrowUp className="w-3 h-3" />;
    if (trend === 'down') return <ArrowDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-600">
          {title}
        </p>
        {Icon && (
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-100">
            <Icon className="w-4 h-4 text-blue-600" />
          </div>
        )}
      </div>

      {loading ? (
        <>
          <Skeleton className="h-8 w-24 mb-2" />
          <Skeleton className="h-4 w-32" />
        </>
      ) : (
        <>
          <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>

          {change !== undefined && (
            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg ${getTrendColor(change) === 'text-emerald-600' ? 'bg-emerald-100' : getTrendColor(change) === 'text-red-600' ? 'bg-red-100' : 'bg-slate-100'}`}>
              <span className={`${trendColor}`}>
                {getTrendIcon()}
              </span>
              <span className={`text-xs font-semibold ${trendColor}`}>
                {Math.abs(change).toFixed(1)}% {changeLabel}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
