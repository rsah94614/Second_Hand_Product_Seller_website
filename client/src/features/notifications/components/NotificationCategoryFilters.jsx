import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { notificationCategoryOptions } from '../utils/notificationMeta';

export const NotificationCategoryFilters = ({ 
  activeCategory, 
  setActiveCategory, 
  categoryCounts, 
  totalCount 
}) => {
  return (
    <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50/80 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
        <SlidersHorizontal className="h-4 w-4 text-primary-600" />
        Category Filters
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {notificationCategoryOptions.map((category) => {
          const isActive = activeCategory === category.value;
          const count = category.value === 'all' 
            ? totalCount 
            : (categoryCounts[category.value] || 0);

          return (
            <button
              key={category.value}
              type="button"
              onClick={() => setActiveCategory(category.value)}
              className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                isActive
                  ? 'border-primary-600 bg-primary-600 text-white shadow-md'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-primary-200 hover:text-primary-700'
              }`}
            >
              <span>{category.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs ${isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
