import React from 'react';
import { Skeleton } from '../../../components/ui/Skeleton';

export const SkeletonGrid = () => (
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="overflow-hidden rounded-[1.75rem] bg-white shadow-sm border border-gray-100">
        <div className="aspect-4/3 w-full bg-gray-50 flex items-center justify-center">
          <Skeleton className="w-full h-full" />
        </div>
        <div className="space-y-3 p-5">
          <Skeleton variant="text" width="40%" height="0.75rem" />
          <Skeleton variant="text" width="100%" height="1.25rem" />
          <Skeleton variant="text" width="60%" height="1.5rem" />
        </div>
      </div>
    ))}
  </div>
);
