import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  MapPin,
  Phone,
  Mail,
  Package,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/Input';
import Footer from '../components/Footer';
import Header from '../components/Header';

const PlaceOrder = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm({
    defaultValues: {
      fullName: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      addressLine1: '',
      addressLine2: '',
      landmark: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
      quantity: 1,
    },
  });

  const quantity = watch('quantity', 1);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () =>
      axios
        .get(import.meta.env.VITE_BACKEND_URL + `/api/products/${id}`)
        .then((res) => res.data),
    enabled: !!id,
  });

  const formatPrice = (price = 0) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);

  const placeOrder = useMutation({
    mutationFn: (payload) =>
      axios.post(import.meta.env.VITE_BACKEND_URL + '/api/orders', payload),

    onSuccess: () => {
      toast.success('Order placed successfully');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      navigate('/orders');
    },

    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to place order');
    },
  });

  const onSubmit = (values) => {
    if (!user) {
      toast.error('Please login to continue');
      navigate('/login');
      return;
    }

    if (!product?._id) {
      toast.error('Product is unavailable');
      return;
    }

    placeOrder.mutate({
      productId: product._id,
      quantity: Math.max(1, Number(values.quantity) || 1),
      shippingDetails: {
        fullName: values.fullName,
        email: values.email,
        phone: values.phone,
        addressLine1: values.addressLine1,
        addressLine2: values.addressLine2,
        landmark: values.landmark,
        city: values.city,
        state: values.state,
        postalCode: values.postalCode,
        country: values.country || 'India',
      },
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-white p-8 rounded-xl shadow-md">
          <Package className="w-12 h-12 mx-auto text-primary-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Login to place an order
          </h2>
          <p className="text-gray-600 mb-6">
            Please sign in to continue with the checkout process.
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
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            {[...Array(6)].map((_, idx) => (
              <div key={idx} className="h-12 bg-gray-200 rounded" />
            ))}
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="h-48 bg-gray-200 rounded-xl" />
            <div className="h-6 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="container text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Product unavailable
          </h2>
          <p className="text-gray-600 mb-6">
            The product you&apos;re trying to order could not be found.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center justify-center bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-primary-600 mb-8 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Product
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Form */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 font-display">
                Shipping Details
              </h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Full Name*
                  </label>
                  <Input
                    type="text"
                    {...register('fullName', { required: 'Full name is required' })}
                    placeholder="John Doe"
                  />
                  {errors.fullName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Email
                    </label>
                    <Input
                      type="email"
                      {...register('email')}
                      placeholder="you@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phone*
                    </label>
                    <Input
                      type="tel"
                      {...register('phone', { required: 'Phone number is required' })}
                      placeholder="+91 98765 43210"
                    />
                    {errors.phone && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.phone.message}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Address Line 1*
                  </label>
                  <Input
                    type="text"
                    {...register('addressLine1', { required: 'Address is required' })}
                    placeholder="House / Flat / Street"
                  />
                  {errors.addressLine1 && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.addressLine1.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Address Line 2
                    </label>
                    <Input
                      type="text"
                      {...register('addressLine2')}
                      placeholder="Apartment, suite, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Landmark
                    </label>
                    <Input
                      type="text"
                      {...register('landmark')}
                      placeholder="Near Central Park"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      City*
                    </label>
                    <Input
                      type="text"
                      {...register('city', { required: 'City is required' })}
                      placeholder="Mumbai"
                    />
                    {errors.city && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.city.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      State*
                    </label>
                    <Input
                      type="text"
                      {...register('state', { required: 'State is required' })}
                      placeholder="Maharashtra"
                    />
                    {errors.state && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.state.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Postal Code*
                    </label>
                    <Input
                      type="text"
                      {...register('postalCode', { required: 'Postal code is required' })}
                      placeholder="400001"
                    />
                    {errors.postalCode && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.postalCode.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Country
                    </label>
                    <Input
                      type="text"
                      {...register('country')}
                      placeholder="India"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Quantity
                  </label>
                  <Input
                    type="number"
                    min="1"
                    {...register('quantity', { valueAsNumber: true, min: 1 })}
                  />
                </div>

                <button
                  type="submit"
                  disabled={placeOrder.isLoading}
                  className="w-full flex items-center justify-center bg-primary-600 text-white py-4 px-6 rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 disabled:opacity-60 disabled:shadow-none"
                >
                  {placeOrder.isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </button>
              </form>
            </div>

            {/* Product Summary */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 h-fit sticky top-24">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 font-display">
                Order Summary
              </h2>
              <div className="space-y-6">
                <div className="relative group">
                  <img
                    src={product.images?.[0] || '/placeholder-image.jpg'}
                    alt={product.title}
                    className="w-full h-64 object-cover rounded-xl shadow-sm"
                  />
                  {product.isSold && (
                    <span className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold shadow-sm">
                      Sold
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {product.title}
                  </h3>
                  <p className="text-gray-600 flex items-center">
                    <MapPin className="w-4 h-4 mr-1.5 text-gray-400" />
                    {product.location}
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl space-y-3 border border-gray-100">
                  <div className="flex justify-between text-gray-600">
                    <span>Price per item</span>
                    <span className="font-medium">{formatPrice(product.price)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Quantity</span>
                    <span className="font-medium">{quantity}</span>
                  </div>
                  <div className="h-px bg-gray-200 my-2"></div>
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total Amount</span>
                    <span className="text-primary-600">{formatPrice((product.price || 0) * quantity)}</span>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-gray-600 bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="font-semibold text-blue-900 mb-2">Seller Contact</p>
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-blue-500" />
                    {product.contactInfo?.phone || 'Phone not provided'}
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-blue-500" />
                    {product.contactInfo?.email || 'Email not provided'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PlaceOrder;

