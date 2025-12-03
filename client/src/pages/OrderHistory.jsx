import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import {
  History,
  Package,
  Clock,
  IndianRupee,
  ShoppingBag,
  X,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import Footer from '../components/Footer';
import Header from '../components/Header';

const statusStyles = {
  processing: 'bg-yellow-100 text-yellow-700',
  shipped: 'bg-blue-100 text-blue-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const OrderHistory = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () =>
      axios
        .get(`${import.meta.env.VITE_BACKEND_URL}/api/orders`)
        .then((res) => res.data),
    enabled: !!user,
  });

  const cancelOrder = useMutation({
    mutationFn: (orderId) =>
      axios.patch(`${import.meta.env.VITE_BACKEND_URL}/api/orders/${orderId}/cancel`),
    onSuccess: () => {
      toast.success('Order cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    },
  });

  const handleCancelOrder = (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      cancelOrder.mutate(orderId);
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
            Track your purchases and download invoices once you&apos;re signed
            in.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="container space-y-4">
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

  return (
   <div>
    <Header />
     <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center">
            <History className="w-8 h-8 mr-3 text-primary-600" />
            Order History
          </h1>
          <p className="text-gray-600 mt-2">
            Review your past purchases and track their status in real-time.
          </p>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl shadow text-center">
            <ShoppingBag className="w-16 h-16 text-primary-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No orders yet
            </h2>
            <p className="text-gray-600 mb-6">
              Once you place an order, it will appear here for easy tracking.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center justify-center bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white p-6 rounded-2xl shadow space-y-4"
              >
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
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${statusStyles[order.status] || statusStyles.processing
                        }`}
                    >
                      {order.status?.charAt(0).toUpperCase() +
                        order.status?.slice(1)}
                    </span>
                    <div className="flex items-center text-gray-700 font-semibold">
                      <IndianRupee className="w-4 h-4" />
                      {formatPrice(order.total)}
                    </div>
                    {order.status === 'processing' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancelOrder(order._id)}
                        disabled={cancelOrder.isLoading}
                        className="text-red-600 hover:bg-red-50 hover:border-red-200"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-4 border-t border-gray-100 pt-4">
                  {order.items?.map((item, index) => (
                    <div
                      key={`${order._id}-${index}`}
                      className="flex items-center space-x-4"
                    >
                      <img
                        src={
                          item.image ||
                          'https://via.placeholder.com/80?text=Product'
                        }
                        alt={item.title}
                        className="w-20 h-20 object-cover rounded-xl"
                      />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {item.title}
                        </h3>
                        <div className="flex items-center text-sm text-gray-600 space-x-4">
                          <span className="flex items-center">
                            <Package className="w-4 h-4 mr-1" />
                            Qty {item.quantity}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatDate(order.updatedAt || order.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Price</p>
                        <p className="text-xl font-semibold text-gray-800">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {order.shippingDetails?.fullName && (
                    <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl text-sm text-gray-700">
                      <p className="font-semibold text-gray-800 mb-1">
                        Shipping to
                      </p>
                      <p>{order.shippingDetails.fullName}</p>
                      {order.shippingDetails.phone && (
                        <p>{order.shippingDetails.phone}</p>
                      )}
                      <p className="text-gray-600">
                        {[
                          order.shippingDetails.addressLine1,
                          order.shippingDetails.addressLine2,
                          order.shippingDetails.landmark,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                      <p className="text-gray-600">
                        {[
                          order.shippingDetails.city,
                          order.shippingDetails.state,
                          order.shippingDetails.postalCode,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </p>
                      {order.shippingDetails.country && (
                        <p className="text-gray-600">
                          {order.shippingDetails.country}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    <Footer />
   </div>
  );
};

export default OrderHistory;
