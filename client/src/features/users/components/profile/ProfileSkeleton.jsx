import React from 'react';
import { Skeleton } from '../../../../components/ui/Skeleton';
import { Card, CardContent } from '../../../../components/ui/Card';

const ProfileSkeleton = () => {
  return (
    <div className="animate-fade-in">
      {/* Profile Hero Skeleton */}
      <div className="relative overflow-hidden rounded-4xl mb-6 bg-slate-900 min-h-[220px]">
        <div className="absolute inset-0 bg-linear-to-br from-slate-800 via-slate-900 to-slate-950 opacity-90" />
        <div className="relative z-10 p-5 md:p-8 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 md:gap-6">
          <Skeleton variant="circular" width="128px" height="128px" className="border-4 border-white/10" />
          <div className="flex-1 space-y-4 pt-2">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <Skeleton width="60px" height="24px" className="rounded-full bg-white/10" />
              <Skeleton width="100px" height="24px" className="rounded-full bg-white/10" />
            </div>
            <Skeleton width="200px" height="32px" className="bg-white/10" />
            <Skeleton width="150px" height="16px" className="bg-white/5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Details Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-4xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <Skeleton width="120px" height="20px" />
              <Skeleton width="60px" height="28px" className="rounded-xl" />
            </div>
            <CardContent className="p-6 space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton width="80px" height="12px" />
                  <Skeleton width="100%" height="48px" className="rounded-2xl" />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Campus Info Skeleton */}
          <Card className="rounded-4xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100">
              <Skeleton width="150px" height="20px" />
            </div>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton width="100px" height="12px" />
                    <Skeleton width="100%" height="48px" className="rounded-2xl" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reputation & Trust Skeleton */}
        <div className="space-y-6">
          <Card className="rounded-4xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100">
              <Skeleton width="140px" height="20px" />
            </div>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl p-4 flex flex-col items-center">
                    <Skeleton width="40px" height="24px" className="mb-2" />
                    <Skeleton width="60px" height="12px" />
                  </div>
                ))}
              </div>
              <Skeleton width="100%" height="60px" className="rounded-3xl" />
            </CardContent>
          </Card>

          {/* Verification Skeleton */}
          <Card className="rounded-4xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100">
              <Skeleton width="130px" height="20px" />
            </div>
            <CardContent className="p-6 space-y-4">
              <div className="flex gap-4">
                <Skeleton variant="circular" width="40px" height="40px" />
                <div className="flex-1 space-y-2">
                  <Skeleton width="150px" height="16px" />
                  <Skeleton width="100%" height="32px" />
                </div>
              </div>
              <Skeleton width="100%" height="48px" className="rounded-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProfileSkeleton;
