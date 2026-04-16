import React, { useMemo, useState } from 'react';
import { useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  PackageCheck,
  Search,
  ShieldCheck,
  Truck,
  User,
  Loader2,
} from 'lucide-react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { Badge } from '../../../components/ui/Badge';
import { Card, CardContent } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { PRODUCT_FALLBACK_IMAGE, setFallbackImage } from '../../../lib/fallbackImages';
import { formatCampusAddress } from '../../../lib/campus';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/Select';
import { getAdminOrders, updateAdminOrder } from '../api/adminApi';

const statusStyles = {
  requested: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-blue-100 text-blue-700',
  meetup_scheduled: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-orange-100 text-orange-700',
};

const AdminOrdersPage = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: '',
    status: '',
  });

  const fetchOrders = async ({ pageParam = null }) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    if (pageParam) params.set('cursor', pageParam);
    params.set('limit', '50');
    return getAdminOrders(params.toString());
  };

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error,
  } = useInfiniteQuery({
    queryKey: ['admin-orders', filters],
    queryFn: fetchOrders,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
  });

  const updateOrderMutation = useMutation({
    mutationFn: ({ orderId, status }) => updateAdminOrder(orderId, { status }),
    onSuccess: (response) => {
      toast.success(response.message || 'Order updated');
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
    onError: (mutationError) => {
      toast.error(mutationError.response?.data?.message || mutationError.message || 'Failed to update order');
    },
  });

  const orders = useMemo(() => {
    return data?.pages.flatMap((page) => page.orders) || [];
  }, [data]);

  const formatPrice = (value = 0) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);

  const formatDate = (value) =>
    new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-red-600">
                Admin Tools
              </p>
              <h1 className="text-4xl font-bold text-gray-900 mt-2">Order Monitoring</h1>
              <p className="text-gray-600 mt-3 max-w-2xl">
                Track platform-wide orders, inspect shipping details, and update delivery progress when needed.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 text-red-700 px-4 py-2 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              Admin Only
            </div>
          </div>
        </section>

        <Card className="rounded-2xl border-gray-100 shadow-sm mb-8 animate-fade-up-delayed">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Input
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                placeholder="Search order ID, user, or product"
                className="pl-10"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value === 'all' ? '' : value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="requested">Requested</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="meetup_scheduled">Meetup Scheduled</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No-Show</SelectItem>
              </SelectContent>
            </Select>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-4">
          {error ? (
            <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-8 text-red-700">
              {error.response?.data?.message || error.message || 'Failed to load admin orders'}
            </div>
          ) : isLoading ? (
            [...Array(5)].map((_, index) => (
              <div key={index} className="h-44 rounded-2xl bg-white border border-gray-100 animate-pulse" />
            ))
          ) : orders.length ? (
            <>
              {orders.map((order) => (
                (() => {
                  const shippingAddress = formatCampusAddress(order.shippingDetails);

                  return (
                <article
                  key={order._id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-fade-in"
                >
                  <div className="flex flex-col xl:flex-row xl:items-start gap-6">
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-2xl font-bold text-gray-900">
                              #{order._id.slice(-6).toUpperCase()}
                            </h2>
                            <Badge className={statusStyles[order.status] || statusStyles.requested}>
                              {order.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-2">
                            Placed on {formatDate(order.createdAt || order.placedAt)}
                          </p>
                        </div>
                        <div className="text-left md:text-right">
                          <p className="text-2xl font-bold text-gray-900">{formatPrice(order.total)}</p>
                          <p className="text-sm text-gray-500 mt-1">{order.items?.length || 0} item(s)</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
                        <div className="rounded-2xl border border-gray-100 p-4">
                          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">User</p>
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900">{order.user?.name || 'Unknown user'}</p>
                              <p className="text-sm text-gray-500">{order.user?.email || 'No email'}</p>
                              {order.user?.phone && <p className="text-sm text-gray-500">{order.user.phone}</p>}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-gray-100 p-4 lg:col-span-2">
                          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Items</p>
                          <div className="space-y-3">
                            {(order.items || []).map((item, index) => (
                              <div key={`${order._id}-${index}`} className="flex items-center gap-3">
                                <img
                                  src={item.image || PRODUCT_FALLBACK_IMAGE}
                                  alt={item.title}
                                  className="w-14 h-14 rounded-xl object-cover bg-gray-100"
                                  onError={setFallbackImage}
                                />
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{item.title}</p>
                                  <p className="text-sm text-gray-500">
                                    {formatPrice(item.price)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {order.shippingDetails?.fullName && (
                        <div className="rounded-2xl border border-gray-100 p-4 mt-4">
                          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Shipping</p>
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
                              <Truck className="w-4 h-4" />
                            </div>
                            <div className="text-sm text-gray-700">
                              <p className="font-semibold text-gray-900">{order.shippingDetails.fullName}</p>
                              {order.shippingDetails.phone && <p>{order.shippingDetails.phone}</p>}
                              {order.shippingDetails.email && <p>{order.shippingDetails.email}</p>}
                              <p>{shippingAddress.primaryLine}</p>
                              <p>{shippingAddress.secondaryLine}</p>
                              <p>{shippingAddress.country}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="xl:w-64 rounded-2xl border border-gray-100 p-4 h-fit">
                      <div className="flex items-center gap-2 text-gray-900 font-semibold mb-4">
                        <PackageCheck className="w-4 h-4 text-primary-600" />
                        Update Status
                      </div>
                      <div className="space-y-3">
                        <Select
                          value={order.status}
                          onValueChange={(value) =>
                            updateOrderMutation.mutate({ orderId: order._id, status: value })
                          }
                          disabled={updateOrderMutation.isPending}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="requested">Requested</SelectItem>
                            <SelectItem value="accepted">Accepted</SelectItem>
                            <SelectItem value="meetup_scheduled">Meetup Scheduled</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                            <SelectItem value="no_show">No-Show</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                          Admin can manage fulfillment state across the platform from here.
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
                  );
                })()
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
                      'Load More Orders'
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-500">
              No orders matched these filters.
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AdminOrdersPage;
