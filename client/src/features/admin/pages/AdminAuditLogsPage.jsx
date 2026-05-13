import React, { useMemo, useState } from 'react';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ShieldCheck, Activity, RefreshCw, Loader2 } from 'lucide-react';
import { PageShell } from '../../../components/layout/PageShell';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { API_BASE_URL } from '../../../config/api';
import { api } from '../../../lib/api/client';

const AdminAuditLogsPage = () => {
  const [targetTypeFilter, setTargetTypeFilter] = useState('');

  const fetchLogs = async ({ pageParam = null }) => {
    const response = await api.get('/api/admin/audit-logs', {
      params: { 
        targetType: targetTypeFilter,
        cursor: pageParam,
        limit: 20
      },
    });
    return response.data;
  };

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['admin-audit-logs', targetTypeFilter],
    queryFn: fetchLogs,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
  });

  const { data: healthData, refetch: refetchHealth } = useQuery({
    queryKey: ['server-health'],
    queryFn: () => axios.get(`${API_BASE_URL}/health`).then(res => res.data),
    refetchInterval: 30000, 
  });

  const logs = useMemo(() => {
    return data?.pages.flatMap((page) => page.logs) || [];
  }, [data]);

  const targetTypes = ['User', 'Product', 'Order', 'Report', 'Category', 'System'];

  return (
    <PageShell maxWidth="max-w-5xl">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 flex items-center gap-3">
              <ShieldCheck className="w-7 h-7 sm:w-8 sm:h-8 text-primary-600" />
              Observability & Audit
            </h1>
            <p className="text-gray-500 mt-2 text-sm sm:text-base">Monitor server health and track administrative actions across the platform.</p>
          </div>
          <button 
            onClick={() => { refetch(); refetchHealth(); }} 
            className="inline-flex w-full sm:w-auto justify-center items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full px-5 py-2.5 sm:py-2 text-sm font-semibold transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {/* Server Health Card */}
        {healthData && (
          <Card className="rounded-2xl border border-gray-100 shadow-sm mb-8">
            <CardContent className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500" /> Server Health Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Status</p>
                  <p className="text-lg font-black text-gray-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                    {healthData.status?.toUpperCase()}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Uptime</p>
                  <p className="text-lg font-black text-gray-900">
                    {Math.floor(healthData.uptime / 60)} minutes
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">RSS Memory</p>
                  <p className="text-lg font-black text-gray-900">
                    {Math.round((healthData.memory?.rss || 0) / 1024 / 1024)} MB
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Heap Used</p>
                  <p className="text-lg font-black text-gray-900">
                    {Math.round((healthData.memory?.heapUsed || 0) / 1024 / 1024)} MB
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Audit Logs Filter */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setTargetTypeFilter('')}
            className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${
              targetTypeFilter === '' ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Types
          </button>
          {targetTypes.map(type => (
            <button
              key={type}
              onClick={() => setTargetTypeFilter(type)}
              className={`px-4 py-2 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${
                targetTypeFilter === type ? 'bg-primary-600 text-white' : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Audit Logs Table */}
        <Card className="rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500 font-bold border-b border-gray-100">
                  <th className="p-4 pl-6">Timestamp</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Target Type</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4 pr-6">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {isLoading ? (
                  <tr><td colSpan="5" className="p-10 text-center text-gray-400 space-y-3">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary-600" />
                    <span>Loading audit logs...</span>
                  </td></tr>
                ) : logs.length === 0 ? (
                  <tr><td colSpan="5" className="p-10 text-center text-gray-400">No audit logs found.</td></tr>
                ) : (
                  <>
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 pl-6 text-gray-500 font-medium whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span className="bg-primary-50 text-primary-700 px-2.5 py-1 rounded-md text-xs font-bold uppercase">
                            {log.action}
                          </span>
                        </td>
                        <td className="p-4 font-semibold text-gray-700">
                          {log.targetType}
                        </td>
                        <td className="p-4 text-gray-600">
                          <p className="font-semibold text-gray-900">{log.actor?.name || 'System'}</p>
                          <span className="text-xs text-gray-400 block">{log.ipAddress}</span>
                        </td>
                        <td className="p-4 pr-6">
                          <div className="bg-gray-50 p-2 rounded-lg text-xs font-mono text-gray-600 border border-gray-100 max-h-24 overflow-y-auto w-full min-w-[200px]">
                            {JSON.stringify(log.details)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
          
          {hasNextPage && (
            <div className="p-6 flex justify-center border-t border-gray-100 bg-gray-50/30">
              <Button
                variant="outline"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                className="min-w-[200px] bg-white transition-all hover:shadow-sm"
              >
                {isFetchingNextPage ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More Logs'
                )}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
};

export default AdminAuditLogsPage;
