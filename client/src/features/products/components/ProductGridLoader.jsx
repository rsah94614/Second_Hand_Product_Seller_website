import React from 'react';
import { Loader2 } from 'lucide-react';

export const ProductGridLoader = ({ isFirstLoad, isFetchingNextPage, hasNextPage, totalCount, productsCount, loaderRef }) => {
  if (isFirstLoad) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="overflow-hidden rounded-[1.75rem] bg-white shadow-sm animate-pulse">
            <div className="aspect-4/3 bg-gray-100" />
            <div className="space-y-3 p-4">
              <div className="h-3 rounded-full bg-gray-100 w-1/3" />
              <div className="h-5 rounded-full bg-gray-100" />
              <div className="h-7 rounded-full bg-gray-100 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div ref={loaderRef} className="flex flex-col items-center justify-center py-12">
      {isFetchingNextPage ? (
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
          <span className="text-sm font-medium">Loading more products…</span>
        </div>
      ) : (
        !hasNextPage && productsCount > 0 && (
          <p className="text-sm text-gray-400 font-medium bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
            You&apos;ve seen all {totalCount} products
          </p>
        )
      )}
    </div>
  );
};
