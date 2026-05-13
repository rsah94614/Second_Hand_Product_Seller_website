import React from 'react';
import { X } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../../components/ui/Select';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

export const ProductFilterSidebar = ({ 
  filters, 
  categories, 
  showFilterPanel, 
  onFilterChange, 
  onClearFilters, 
  hasActiveFilters 
}) => {
  return (
    <aside className={`w-full lg:w-64 shrink-0 lg:block ${showFilterPanel ? 'block' : 'hidden'}`}>
      <div className="sticky top-24 space-y-8 bg-white backdrop-blur-md p-6 rounded-3xl border border-gray-300 shadow-sm">
        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Category</h3>
          <Select 
            value={filters.category || 'all'} 
            onValueChange={(v) => onFilterChange('category', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-10 w-full rounded-xl text-sm border-gray-200 bg-white">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Price Range</h3>
          <div className="flex items-center gap-2">
            <Input 
              type="number" 
              value={filters.minPrice} 
              onChange={(e) => onFilterChange('minPrice', e.target.value)} 
              placeholder="Min" 
              className="h-10 text-sm" 
            />
            <span className="text-gray-400 font-bold">-</span>
            <Input 
              type="number" 
              value={filters.maxPrice} 
              onChange={(e) => onFilterChange('maxPrice', e.target.value)} 
              placeholder="Max" 
              className="h-10 text-sm" 
            />
          </div>
        </div>

        {hasActiveFilters && (
          <Button
            onClick={onClearFilters}
            variant="outline"
            className="w-full text-red-500 border-red-200 hover:bg-red-50 rounded-xl mt-4"
          >
            <X className="w-4 h-4 mr-2" /> Clear All Filters
          </Button>
        )}
      </div>
    </aside>
  );
};
