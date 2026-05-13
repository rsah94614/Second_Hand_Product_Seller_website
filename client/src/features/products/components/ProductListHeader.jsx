import React from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../../components/ui/Select';

export const ProductListHeader = ({ 
  totalCount, 
  filters, 
  onFilterChange, 
  onUpdateFilters, 
  showFilterPanel, 
  setShowFilterPanel, 
  hasActiveFilters, 
  isLoading 
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-gray-900">
          {!isLoading && totalCount > 0 ? (
            <><span className="text-primary-600">{totalCount}</span> Products</>
          ) : 'All Products'}
        </h1>
        
        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mt-3">
            {filters.category && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 border border-primary-200 px-3 py-1 text-xs font-bold text-primary-700">
                {filters.category}
                <button onClick={() => onFilterChange('category', '')}><X className="h-3 w-3" /></button>
              </span>
            )}
            {filters.search && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-200 px-3 py-1 text-xs font-bold text-gray-600">
                "{filters.search}"
                <button onClick={() => onFilterChange('search', '')}><X className="h-3 w-3" /></button>
              </span>
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-700">
                ₹{filters.minPrice || 0}–{filters.maxPrice || '∞'}
                <button onClick={() => { onFilterChange('minPrice', ''); onFilterChange('maxPrice', ''); }}><X className="h-3 w-3" /></button>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Button
          onClick={() => setShowFilterPanel((p) => !p)}
          variant="outline"
          className={`lg:hidden gap-2 rounded-full px-5 h-10 text-sm font-bold ${showFilterPanel ? 'bg-primary-600 text-white border-primary-600' : ''}`}
        >
          <Filter className="w-4 h-4" />
          Filters
        </Button>

        <Select
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onValueChange={(value) => {
            const [sortBy, sortOrder] = value.split('-');
            onUpdateFilters({ ...filters, sortBy, sortOrder });
          }}
        >
          <SelectTrigger className="h-10 rounded-full text-sm font-bold bg-white border-gray-200 shadow-sm px-5 w-48 focus:ring-primary-500">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="createdAt-desc">Newest First</SelectItem>
            <SelectItem value="createdAt-asc">Oldest First</SelectItem>
            <SelectItem value="price-asc">Price: Low → High</SelectItem>
            <SelectItem value="price-desc">Price: High → Low</SelectItem>
            <SelectItem value="views-desc">Most Popular</SelectItem>
            <SelectItem value="averageRating-desc">Top Rated</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};
