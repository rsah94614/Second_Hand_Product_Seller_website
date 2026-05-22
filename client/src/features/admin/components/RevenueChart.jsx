import React from 'react';
import { Skeleton } from '../../../components/ui/Skeleton';

export function RevenueChart({ data, title = '30-Day Revenue Trend', loading = false }) {
  if (loading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-gray-900 mb-4">{title}</p>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold text-gray-900 mb-4">{title}</p>
        <div className="h-64 flex items-center justify-center">
          <p className="text-sm text-gray-500">No data available</p>
        </div>
      </div>
    );
  }

  // Find min and max values for scaling
  const revenues = data.map((d) => d.revenue);
  const maxRevenue = Math.max(...revenues);
  const minRevenue = Math.min(...revenues);
  const range = maxRevenue - minRevenue || maxRevenue;

  // Create SVG chart
  const chartHeight = 256;
  const chartWidth = 100;
  const padding = 40;
  const graphHeight = chartHeight - padding * 2;
  const graphWidth = chartWidth - padding * 2;
  const pointSpacing = graphWidth / (data.length - 1 || 1);

  const points = data.map((d, i) => {
    const x = padding + i * pointSpacing;
    const y = padding + graphHeight - ((d.revenue - minRevenue) / range) * graphHeight;
    return { x, y, revenue: d.revenue, date: d.date };
  });

  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-gray-900 mb-4">{title}</p>

      <div className="overflow-x-auto">
        <svg
          width="100%"
          height={chartHeight}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="none"
          className="min-w-full"
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => (
            <line
              key={`grid-${i}`}
              x1={padding}
              y1={padding + graphHeight * ratio}
              x2={chartWidth - padding}
              y2={padding + graphHeight * ratio}
              stroke="#e5e7eb"
              strokeWidth="0.5"
            />
          ))}

          {/* Y-axis */}
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={chartHeight - padding}
            stroke="#d1d5db"
            strokeWidth="1"
          />

          {/* X-axis */}
          <line
            x1={padding}
            y1={chartHeight - padding}
            x2={chartWidth - padding}
            y2={chartHeight - padding}
            stroke="#d1d5db"
            strokeWidth="1"
          />

          {/* Line path */}
          <path
            d={pathData}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />

          {/* Data points */}
          {points.map((p, i) => (
            <circle
              key={`point-${i}`}
              cx={p.x}
              cy={p.y}
              r="2"
              fill="#3b82f6"
              stroke="white"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          {/* X-axis labels */}
          {points.map((p, i) => {
            if (i % Math.ceil(data.length / 5) === 0 || i === data.length - 1) {
              const date = new Date(data[i].date);
              const label = `${date.getDate()}/${date.getMonth() + 1}`;
              return (
                <text
                  key={`label-${i}`}
                  x={p.x}
                  y={chartHeight - padding + 15}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#6b7280"
                >
                  {label}
                </text>
              );
            }
            return null;
          })}
        </svg>
      </div>
    </div>
  );
}
