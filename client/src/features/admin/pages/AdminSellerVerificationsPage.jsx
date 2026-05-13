import React, { useMemo, useState } from 'react';
import { useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ShieldCheck, BadgeCheck, XCircle, Loader2 } from 'lucide-react';
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
import { getSellerVerifications, approveSellerVerification, rejectSellerVerification } from '../api/adminApi';

const statusTone = {
  pending: 'bg-amber-50 text-amber-700',
  verified: 'bg-emerald-50 text-emerald-700',
  rejected: 'bg-red-50 text-red-700',
};

const AdminSellerVerificationsPage = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [rejectionReasons, setRejectionReasons] = useState({});

  const fetchVerifications = async ({ pageParam = null }) => {
    const p = new URLSearchParams();
    if (statusFilter) p.set('status', statusFilter);
    if (pageParam) p.set('cursor', pageParam);
    p.set('limit', '20');
    return getSellerVerifications(p.toString());
  };

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['admin-seller-verifications', statusFilter],
    queryFn: fetchVerifications,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
  });

  const approveMutation = useMutation({
    mutationFn: (userId) => approveSellerVerification(userId),
    onSuccess: () => {
      toast.success('Seller verification approved');
      queryClient.invalidateQueries({ queryKey: ['admin-seller-verifications'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ userId, reason }) => rejectSellerVerification(userId, { reason }),
    onSuccess: () => {
      toast.success('Seller verification rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-seller-verifications'] });
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Failed to reject'),
  });

  const users = useMemo(() => {
    const raw = data?.pages.flatMap((page) => page.users) || [];
    const seen = new Set();
    return raw.filter((u) => {
      if (!u?._id || seen.has(u._id)) return false;
      seen.add(u._id);
      return true;
    });
  }, [data]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero */}
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-emerald-600">Admin Tools</p>
              <h1 className="text-4xl font-bold text-gray-900 mt-2">Seller Verifications</h1>
              <p className="text-gray-600 mt-3 max-w-2xl">
                Review seller verification requests and approve or reject them based on eligibility criteria.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-4 py-2 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              Admin Only
            </div>
          </div>
        </section>

        {/* Filter */}
        <Card className="rounded-2xl border-gray-100 shadow-sm mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="verified">Verified</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* List */}
        <section className="space-y-4">
          {isLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="h-36 rounded-2xl border border-gray-100 bg-white animate-pulse" />
            ))
          ) : users.length ? (
            <>
              {users.map((user) => (
                <Card key={user._id} className="rounded-2xl border-gray-100 shadow-sm">
                  <CardHeader className="border-b border-gray-100 pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <BadgeCheck className="w-5 h-5 text-emerald-600" />
                        {user.name}
                      </CardTitle>
                      <Badge className={`${statusTone[user.sellerVerificationStatus] || statusTone.pending} border-transparent`}>
                        {user.sellerVerificationStatus}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</p>
                        <p className="mt-1 text-gray-800">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg Rating</p>
                        <p className="mt-1 text-gray-800">{user.averageRating?.toFixed(1) || '—'} ★</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Reviews</p>
                        <p className="mt-1 text-gray-800">{user.reviewCount ?? 0}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Requested</p>
                        <p className="mt-1 text-gray-800">
                          {user.sellerVerificationRequestedAt
                            ? new Date(user.sellerVerificationRequestedAt).toLocaleDateString('en-IN')
                            : '—'}
                        </p>
                      </div>
                    </div>

                    {user.sellerVerificationStatus === 'pending' && (
                      <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(user._id)}
                          disabled={approveMutation.isPending}
                          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <BadgeCheck className="w-4 h-4" />
                          Approve
                        </Button>
                        <div className="flex flex-1 gap-2">
                          <Input
                            placeholder="Rejection reason (required)..."
                            value={rejectionReasons[user._id] || ''}
                            onChange={(e) => setRejectionReasons((p) => ({ ...p, [user._id]: e.target.value }))}
                            className="flex-1"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const reason = rejectionReasons[user._id]?.trim();
                              if (!reason) { toast.error('Enter a rejection reason'); return; }
                              rejectMutation.mutate({ userId: user._id, reason });
                            }}
                            disabled={rejectMutation.isPending}
                            className="gap-2 text-red-600 border-red-200 hover:bg-red-50 shrink-0"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    )}

                    {user.sellerVerificationStatus === 'rejected' && user.sellerVerificationReason && (
                      <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                        <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">Rejection Reason</p>
                        <p className="text-red-800 text-sm">{user.sellerVerificationReason}</p>
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
                      'Load More Requests'
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Card className="rounded-2xl border-gray-100 shadow-sm">
              <CardContent className="p-10 text-center text-gray-500">
                No {statusFilter} verification requests.
              </CardContent>
            </Card>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AdminSellerVerificationsPage;
