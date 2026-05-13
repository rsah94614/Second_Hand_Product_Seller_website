import React, { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, Inbox, CheckCircle, Loader2, UserCog } from 'lucide-react';
import { useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/Select';
import { getModerationQueue, resolveModerationItem, assignModerationItem } from '../api/adminApi';

const priorityTone = {
  high: 'bg-red-50 text-red-700',
  medium: 'bg-amber-50 text-amber-700',
  low: 'bg-slate-100 text-slate-600',
};

const statusTone = {
  pending: 'bg-yellow-50 text-yellow-700',
  in_progress: 'bg-blue-50 text-blue-700',
  resolved: 'bg-emerald-50 text-emerald-700',
};

const AdminModerationQueuePage = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({ status: '', priority: '', itemType: '' });
  const [resolutionText, setResolutionText] = useState({});

  const fetchItems = async ({ pageParam = null }) => {
    const p = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) p.set(k, v); });
    if (pageParam) p.set('cursor', pageParam);
    p.set('limit', '20');
    return getModerationQueue(p.toString());
  };

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['admin-moderation-queue', filters],
    queryFn: fetchItems,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ itemId, resolution }) => resolveModerationItem(itemId, { resolution }),
    onSuccess: () => {
      toast.success('Item resolved');
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-queue'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to resolve'),
  });

  const assignMutation = useMutation({
    mutationFn: (itemId) => assignModerationItem(itemId, {}),
    onSuccess: () => {
      toast.success('Assigned to you');
      queryClient.invalidateQueries({ queryKey: ['admin-moderation-queue'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to assign'),
  });

  const items = useMemo(() => {
    const raw = data?.pages.flatMap((page) => page.items) || [];
    const seen = new Set();
    return raw.filter((item) => {
      if (!item?._id || seen.has(item._id)) return false;
      seen.add(item._id);
      return true;
    });
  }, [data]);

  const stats = data?.pages?.[0]?.stats || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-indigo-600">Admin Tools</p>
              <h1 className="text-4xl font-bold text-gray-900 mt-2">Moderation Queue</h1>
              <p className="text-gray-600 mt-3 max-w-2xl">
                Review flagged content, assign items to moderators, and track resolution status.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 text-indigo-700 px-4 py-2 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              Admin Only
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Pending', value: stats.pending ?? 0, tone: 'text-yellow-600' },
            { label: 'In Progress', value: stats.in_progress ?? 0, tone: 'text-blue-600' },
            { label: 'Resolved', value: stats.resolved ?? 0, tone: 'text-emerald-600' },
            { label: 'Total', value: stats.total ?? 0, tone: 'text-gray-700' },
          ].map((s) => (
            <Card key={s.label} className="rounded-2xl border-gray-100 shadow-sm">
              <CardContent className="p-5">
                <p className={`text-3xl font-black ${s.tone}`}>{s.value}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="rounded-2xl border-gray-100 shadow-sm mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select value={filters.status || 'all'} onValueChange={(v) => setFilters((p) => ({ ...p, status: v === 'all' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.priority || 'all'} onValueChange={(v) => setFilters((p) => ({ ...p, priority: v === 'all' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="All priorities" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.itemType || 'all'} onValueChange={(v) => setFilters((p) => ({ ...p, itemType: v === 'all' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="All types" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Items */}
        <section className="space-y-4">
          {isLoading ? (
            [...Array(4)].map((_, i) => (
              <div key={i} className="h-40 rounded-2xl border border-gray-100 bg-white animate-pulse" />
            ))
          ) : items.length ? (
            <>
              {items.map((item) => (
                <Card key={item._id} className="rounded-2xl border-gray-100 shadow-sm">
                  <CardHeader className="border-b border-gray-100 pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Inbox className="w-5 h-5 text-indigo-600" />
                        {item.itemType?.charAt(0).toUpperCase() + item.itemType?.slice(1)} — {String(item.itemId).slice(-8).toUpperCase()}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={`${priorityTone[item.priority] || priorityTone.medium} border-transparent`}>
                          {item.priority}
                        </Badge>
                        <Badge className={`${statusTone[item.status] || statusTone.pending} border-transparent`}>
                          {item.status?.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Reason</p>
                      <p className="text-gray-800">{item.reason}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <span>Added: {new Date(item.createdAt).toLocaleDateString('en-IN')}</span>
                      {item.assignedTo && (
                        <span className="flex items-center gap-1">
                          <UserCog className="w-3.5 h-3.5" />
                          Assigned to: {item.assignedTo.name || item.assignedTo.email}
                        </span>
                      )}
                    </div>

                    {item.status !== 'resolved' && (
                      <div className="flex flex-col sm:flex-row gap-3">
                        {!item.assignedTo && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => assignMutation.mutate(item._id)}
                            disabled={assignMutation.isPending}
                            className="gap-2"
                          >
                            <UserCog className="w-4 h-4" />
                            Assign to Me
                          </Button>
                        )}
                        <div className="flex flex-1 gap-2">
                          <Input
                            placeholder="Resolution notes..."
                            value={resolutionText[item._id] || ''}
                            onChange={(e) => setResolutionText((p) => ({ ...p, [item._id]: e.target.value }))}
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            onClick={() => {
                              const resolution = resolutionText[item._id]?.trim();
                              if (!resolution) { toast.error('Enter a resolution note'); return; }
                              resolveMutation.mutate({ itemId: item._id, resolution });
                            }}
                            disabled={resolveMutation.isPending}
                            className="gap-2 shrink-0"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Resolve
                          </Button>
                        </div>
                      </div>
                    )}

                    {item.status === 'resolved' && item.resolution && (
                      <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">Resolution</p>
                        <p className="text-emerald-800 text-sm">{item.resolution}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              {hasNextPage && (
                <div className="py-6 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="min-w-[200px]"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More Items'
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card className="rounded-2xl border-gray-100 shadow-sm">
              <CardContent className="p-10 text-center text-gray-500">
                No items in the moderation queue.
              </CardContent>
            </Card>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AdminModerationQueuePage;
