import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import {
  History,
  Clock,
  IndianRupee,
  ShoppingBag,
  X,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import Footer from '../../../components/Footer';
import Header from '../../../components/Header';
import { PRODUCT_FALLBACK_IMAGE, setFallbackImage } from '../../../lib/fallbackImages';
import { formatCampusAddress } from '../../../lib/campus';
import { cancelOrder, completeOrder, reportNoShow, getOrders } from '../api/orderApi';
import { ErrorState } from '../../../components/ui/ErrorState';

const statusStyles = {
  requested: 'bg-yellow-100 text-yellow-700',
  accepted: 'bg-blue-100 text-blue-700',
  meetup_scheduled: 'bg-indigo-100 text-indigo-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  no_show: 'bg-orange-100 text-orange-700',
};

const OrderHistoryPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
    enabled: !!user,
  });

  const cancelOrderMutation = useMutation({
    mutationFn: (orderId) => cancelOrder(orderId),
    onSuccess: () => {
      toast.success('Order cancelled');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    },
  });

  const completeOrderMutation = useMutation({
    mutationFn: (orderId) => completeOrder(orderId),
    onSuccess: () => {
      toast.success('Order marked as complete!');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to complete order');
    },
  });

  const noShowMutation = useMutation({
    mutationFn: (orderId) => reportNoShow(orderId),
    onSuccess: () => {
      toast.success('Reported as No-Show');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to report no-show');
    },
  });

  const handleCancelOrder = (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      cancelOrderMutation.mutate(orderId);
    }
  };

  const handleCompleteOrder = (orderId) => {
    if (window.confirm('Are you sure you want to mark this order as completed? Did you receive the item?')) {
      completeOrderMutation.mutate(orderId);
    }
  };

  const handleNoShow = (orderId) => {
    if (window.confirm('Are you sure you want to report a No-Show? This affects the seller\'s trust score.')) {
      noShowMutation.mutate(orderId);
    }
  };

  const formatPrice = (price = 0) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-white p-8 rounded-xl shadow-md">
          <History className="w-12 h-12 mx-auto text-primary-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Login to view your orders
          </h2>
          <p className="text-gray-600 mb-6">
            Track your purchases and download invoices once you&apos;re signed in.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center"
          >
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-6 md:py-10">
        <div className="max-w-7xl mx-auto px-4 space-y-4">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-2xl shadow animate-pulse space-y-4"
            >
              <div className="h-6 w-1/3 bg-gray-200 rounded" />
              <div className="h-4 w-1/4 bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-2/3 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const orders = data || [];

  if (isError) {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ErrorState
              title="Could not load orders"
              description="There was a problem fetching your order history. Please try again."
              onRetry={refetch}
            />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6 md:mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center">
              <History className="w-6 h-6 md:w-8 md:h-8 mr-3 text-primary-600" />
              Order History
            </h1>
            <p className="text-gray-600 mt-2">
              Review your past purchases and track their status in real-time.
            </p>
          </div>

          {orders.length === 0 ? (
            <Card className="rounded-2xl border-gray-100 shadow-sm text-center animate-fade-in">
              <CardContent className="p-10">
              <ShoppingBag className="w-16 h-16 text-primary-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                No orders yet
              </h2>
              <p className="text-gray-600 mb-6">
                Once you place an order, it will appear here for easy tracking.
              </p>
              <Link
                to="/products"
                className="inline-flex items-center justify-center"
              >
                <Button>Browse Products</Button>
              </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                (() => {
                  const shippingAddress = formatCampusAddress(order.shippingDetails);

                  return (
                <Card
                  key={order._id}
                  className="space-y-4 rounded-2xl border-gray-100 shadow-sm animate-fade-in"
                >
                  <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Order ID</p>
                      <p className="text-lg font-semibold text-gray-800">
                        #{order._id.slice(-6).toUpperCase()}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Placed on {formatDate(order.createdAt || order.placedAt)}
                      </p>
                    </div>
                    <div className="mt-3 md:mt-0 flex items-center gap-3">
                      <Badge className={`px-3 py-1 text-sm ${statusStyles[order.status] || statusStyles.requested}`}>
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                      </Badge>
                      <div className="flex items-center text-gray-700 font-semibold">
                        <IndianRupee className="w-4 h-4" />
                        {formatPrice(order.total)}
                      </div>
                      {order.status === 'requested' || order.status === 'accepted' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelOrder(order._id)}
                          disabled={cancelOrderMutation.isPending}
                          className="text-red-600 hover:bg-red-50 hover:border-red-200"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                      ) : null}
                      
                      {order.status === 'meetup_scheduled' && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCompleteOrder(order._id)}
                            disabled={completeOrderMutation.isPending}
                            className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Complete
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleNoShow(order._id)}
                            disabled={noShowMutation.isPending}
                            className="text-orange-600 hover:bg-orange-50 hover:border-orange-200"
                          >
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            No-Show
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 border-t border-gray-100 pt-4">
                    {order.items?.map((item, index) => (
                      <div key={`${order._id}-${index}`} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                        <img
                          src={item.image || PRODUCT_FALLBACK_IMAGE}
                          alt={item.title}
                          className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl shrink-0"
                          onError={setFallbackImage}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
                            {item.title}
                          </h3>
                          <div className="flex flex-wrap items-center text-sm text-gray-600 gap-x-4 gap-y-1 mt-1">
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {formatDate(order.updatedAt || order.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <p className="text-xs text-gray-500">Price</p>
                          <p className="text-lg sm:text-xl font-semibold text-gray-800">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                    {order.shippingDetails?.fullName && (
                      <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm text-gray-700">
                        <p className="font-semibold text-gray-800 mb-1">
                          Delivery / Meetup Details
                        </p>
                        <p>{order.shippingDetails.fullName}</p>
                        {order.shippingDetails.phone && <p>{order.shippingDetails.phone}</p>}
                        <p className="text-gray-600">{shippingAddress.primaryLine}</p>
                        <p className="text-gray-600">{shippingAddress.secondaryLine}</p>
                        <p className="text-gray-600">{shippingAddress.country}</p>
                      </div>
                    )}
                  </div>
                  </CardContent>
                </Card>
                  );
                })()
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OrderHistoryPage;
