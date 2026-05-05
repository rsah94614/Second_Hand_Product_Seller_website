import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ShoppingCart,
  Trash2,
  PackageCheck,
  Minus,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { PRODUCT_FALLBACK_IMAGE, setFallbackImage } from '../../../lib/fallbackImages';
import { API_BASE_URL } from '../../../config/api';
import { ErrorState } from '../../../components/ui/ErrorState';
import { Input } from '../../../components/ui/Input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/Dialog';
import { getCampusPickupLabel, getCampusShippingDefaults } from '../../../lib/campus';

const CartPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [shippingDetails, setShippingDetails] = useState({
    fullName: user?.name || '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    ...getCampusShippingDefaults(),
  });

  useEffect(() => {
    if (user) {
      setShippingDetails(prev => ({
        ...prev,
        fullName: prev.fullName || user.name || '',
      }));
    }
  }, [user]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['cart'],
    queryFn: () =>
      axios.get(`${API_BASE_URL}/api/cart`).then((res) => res.data),
    enabled: !!user,
  });

  const removeItem = useMutation({
    mutationFn: (productId) =>
      axios.delete(
        `${API_BASE_URL}/api/cart/${productId}`
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Item removed from cart');
    },

    onError: () => {
      toast.error('Unable to remove item. Please try again.');
    },
  });

  const updateQuantity = useMutation({
    mutationFn: ({ productId, quantity }) =>
      axios.put(`${API_BASE_URL}/api/cart/${productId}`, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update quantity');
    },
  });

  const checkout = useMutation({
    mutationFn: (details) =>
      axios.post(`${API_BASE_URL}/api/cart/checkout`, { shippingDetails: details }),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setIsAddressModalOpen(false);

      toast.success('Order placed successfully');
      navigate('/orders');
    },

    onError: (error) => {
      toast.error(error.response?.data?.message || 'Checkout failed');
    },
  });

  const formatPrice = (price = 0) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);

  const validateShippingDetails = () => {
    const requiredFields = [
      ['fullName', 'full name'],
      ['addressLine1', 'hostel / department / meetup spot'],
    ];

    const missingFields = requiredFields
      .filter(([key]) => !shippingDetails[key]?.trim())
      .map(([, label]) => label);

    if (missingFields.length > 0) {
      toast.error(`Please add ${missingFields.join(', ')}`);
      return false;
    }

    return true;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-white p-8 rounded-xl shadow-md">
          <ShoppingCart className="w-12 h-12 mx-auto text-primary-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Login to view your cart
          </h2>
          <p className="text-gray-600 mb-6">
            Your cart items are saved to your account. Please login to continue
            shopping.
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
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse"
                >
                  <div className="flex space-x-4">
                    <div className="w-32 h-32 bg-gray-200 rounded-lg" />
                    <div className="flex-1 space-y-4">
                      <div className="h-6 w-3/4 bg-gray-200 rounded" />
                      <div className="h-4 w-1/2 bg-gray-200 rounded" />
                      <div className="h-4 w-1/3 bg-gray-200 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4 animate-pulse h-fit">
              <div className="h-6 w-1/2 bg-gray-200 rounded" />
              <div className="h-4 w-full bg-gray-200 rounded" />
              <div className="h-4 w-2/3 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const items = data?.items || [];
  const summary = data?.summary || { itemCount: 0, totalAmount: 0 };

  const hasUnavailableItems = items.some(
    (item) => !item.product || item.product.isSold || item.product.isActive === false
  );

  if (isError) {
    return (
      <div>
        <Header />
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ErrorState
              title="Could not load your cart"
              description="There was a problem fetching your cart. Please try again."
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
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 font-display flex items-center">
              <ShoppingCart className="w-8 h-8 mr-3 text-primary-600" />
              Your Cart
            </h1>
            <p className="text-gray-600 mt-2">
              {summary.itemCount} item{summary.itemCount === 1 ? '' : 's'} in your
              cart
            </p>
          </div>

          {items.length === 0 ? (
            <Card className="mx-auto max-w-2xl rounded-2xl border-gray-100 shadow-sm text-center animate-fade-in">
              <CardContent className="p-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShoppingCart className="w-12 h-12 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Your cart is empty
                </h2>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Looks like you haven&apos;t added anything yet. Browse our products to find something you love!
                </p>
                <Link
                  to="/products"
                  className="inline-flex items-center justify-center"
                >
                  <Button className="px-8 py-3 shadow-lg shadow-primary-600/20">Start Shopping</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {items.map((item, index) => {
                  const isItemUnavailable = !item.product || item.product.isSold || item.product.isActive === false;
                  return (
                  <div
                    key={item._id || `${item.product?._id || 'unknown'}-${index}`}
                    className={`p-6 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6 group transition-shadow ${isItemUnavailable ? 'opacity-60 bg-gray-50/50' : 'hover:shadow-md'}`}
                  >
                    <div className="relative w-full sm:w-32 h-32 shrink-0">
                      <img
                        src={
                          item.product?.images?.[0] ||
                          PRODUCT_FALLBACK_IMAGE
                        }
                        alt={item.product?.title || 'Unknown Product'}
                        className="w-full h-full object-cover rounded-xl"
                        onError={setFallbackImage}
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                              {item.product?.title || 'Product removed'}
                            </h3>
                            {isItemUnavailable && (
                              <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/10 mb-2">
                                Currently Unavailable
                              </span>
                            )}
                          </div>
                          <button
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            onClick={() => removeItem.mutate(item.product?._id || item._id)}
                            title="Remove item"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-500 mb-4 flex items-center">
                          {getCampusPickupLabel(item.product?.location)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-3">
                          {!isItemUnavailable && (
                            <div className="flex items-center rounded-lg border border-gray-200 bg-gray-50 p-1">
                              <button
                                type="button"
                                onClick={() => updateQuantity.mutate({ productId: item.product?._id, quantity: Math.max(1, item.quantity - 1) })}
                                disabled={updateQuantity.isPending || item.quantity <= 1}
                                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white hover:shadow-sm text-gray-500 disabled:opacity-30 transition-all"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <span className="w-10 text-center font-bold text-gray-800">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity.mutate({ productId: item.product?._id, quantity: item.quantity + 1 })}
                                disabled={updateQuantity.isPending || item.quantity >= (item.product?.stock || 1)}
                                className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-white hover:shadow-sm text-gray-500 disabled:opacity-30 transition-all"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                          {!isItemUnavailable && item.product?.stock <= 5 && (
                             <span className="text-[10px] font-bold text-orange-600 ml-1">
                               Only {item.product.stock} left
                             </span>
                          )}
                          {!isItemUnavailable && (
                            <span className="text-xs text-gray-400 font-medium font-serif italic">
                              {formatPrice(item.product?.price || 0)} / unit
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${isItemUnavailable ? 'text-gray-500 line-through' : 'text-black'}`}>
                            {formatPrice(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )})}
              </div>

              <Card className="md:sticky md:top-24 h-fit rounded-2xl border-gray-100 shadow-sm animate-fade-up-delayed">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl text-gray-900">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-2">
                  <div className="space-y-4 border-b border-gray-100 pb-6">
                    <div className="flex justify-between text-gray-600">
                      <span>Subtotal ({summary.itemCount} items)</span>
                      <span className="font-medium text-gray-900">{formatPrice(summary.totalAmount)}</span>
                    </div>
                    {/* <div className="flex justify-between text-gray-600">
                      <span>Delivery Charges</span>
                      <span className="text-green-600 font-medium">Free</span>
                    </div> */}
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold text-gray-900 my-6">
                    <span>Total Amount</span>
                    <span className="text-2xl">{formatPrice(summary.totalAmount)}</span>
                  </div>
                  <Button
                    className="w-full py-4 shadow-lg shadow-primary-600/20"
                    onClick={() => setIsAddressModalOpen(true)}
                    disabled={checkout.isPending || hasUnavailableItems}
                  >
                    {checkout.isPending ? (
                      'Processing...'
                    ) : (
                      <>
                        <PackageCheck className="w-5 h-5 mr-2" />
                        Proceed to Checkout
                      </>
                    )}
                  </Button>
                  {hasUnavailableItems && (
                    <p className="mt-4 text-xs font-semibold text-red-600 text-center bg-red-50 border border-red-100 p-2.5 rounded-xl">
                      Remove unavailable items from your cart to proceed.
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Secure Checkout
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
      <Footer />

      <Dialog open={isAddressModalOpen} onOpenChange={setIsAddressModalOpen}>
          <DialogContent className="sm:max-w-[500px] p-6 rounded-3xl z-50">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Campus Checkout</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold">Full Name</label>
                <Input value={shippingDetails.fullName} onChange={e => setShippingDetails(prev => ({...prev, fullName: e.target.value}))} placeholder="John Doe" />
              </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Hostel / Department / Meetup Spot</label>
              <Input value={shippingDetails.addressLine1} onChange={e => setShippingDetails(prev => ({...prev, addressLine1: e.target.value}))} placeholder="Girls Hostel, Admin Block, Library gate..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Additional Note</label>
              <Input value={shippingDetails.addressLine2} onChange={e => setShippingDetails(prev => ({...prev, addressLine2: e.target.value}))} placeholder="Preferred time, block, floor, or extra directions" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold">Nearby Landmark</label>
              <Input value={shippingDetails.landmark} onChange={e => setShippingDetails(prev => ({...prev, landmark: e.target.value}))} placeholder="Near canteen, hostel gate, admin block" />
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Checkout is campus-specific, so location will be recorded under Gauhati University, Guwahati, Assam.
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={() => setIsAddressModalOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!validateShippingDetails()) {
                  return;
                }

                checkout.mutate({
                  ...shippingDetails,
                  ...getCampusShippingDefaults(),
                });
              }}
              disabled={checkout.isPending}
            >
              {checkout.isPending ? 'Placing Order...' : 'Place Campus Order'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CartPage;
