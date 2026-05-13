import React from 'react';
import { Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export const ProductEmptyState = ({ onClearFilters }) => {
  return (
    <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white/50 p-20 text-center animate-fade-in">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-50">
        <Package className="h-10 w-10 text-gray-300" />
      </div>
      <h3 className="text-xl font-black text-gray-900">No products found</h3>
      <p className="mt-2 text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
        We couldn&apos;t find listings matching your filters. Try removing some filters or search for something else.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Button variant="outline" onClick={onClearFilters} className="rounded-full px-6">
          Clear Filters
        </Button>
        <Link to="/create-product">
          <Button variant="primary" className="rounded-full px-6">
            List an Item
          </Button>
        </Link>
      </div>
    </div>
  );
};
