import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  MapPin,
  Mail,
  Package,
  ArrowLeft,
  Loader2,
  Minus,
  Plus,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import Footer from '../../../components/Footer';
import Header from '../../../components/Header';
import { PRODUCT_FALLBACK_IMAGE, setFallbackImage } from '../../../lib/fallbackImages';
import { getCampusPickupLabel, getCampusShippingDefaults } from '../../../lib/campus';
import { getProduct } from '../../products/api/productApi';
import { placeOrder } from '../api/orderApi';

const PlaceOrderPage = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = React.useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      fullName: user?.name || '',
      email: user?.email || '',
      addressLine1: '',
      addressLine2: '',
      landmark: '',
      ...getCampusShippingDefaults(),
    },
  });

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id),
    enabled: !!id,
  });

  const formatPrice = (price = 0) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);

  const placeOrderMutation = useMutation({
    mutationFn: (payload) => placeOrder(payload),
    onSuccess: () => {
      toast.success('Order placed successfully');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      navigate('/orders');
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || err.message || 'Failed to place order');
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

    placeOrderMutation.mutate({
      productId: product._id,
      quantity,
      shippingDetails: {
        fullName: values.fullName,
        email: values.email,
        addressLine1: values.addressLine1,
        addressLine2: values.addressLine2,
        landmark: values.landmark,
        ...getCampusShippingDefaults(),
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
            className="inline-flex items-center justify-center"
          >
            <Button>Browse Products</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-50 py-6 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button
            onClick={() => navigate(-1)}
            variant="ghost"
            className="mb-5 md:mb-8 px-0 text-sm font-medium text-gray-600 hover:text-primary-600 hover:bg-transparent"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Product
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <Card className="rounded-2xl border-gray-100 shadow-sm animate-fade-in">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl md:text-2xl text-gray-900">Campus Meetup Details</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-8 pt-2">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Full Name*
                  </label>
                  <Input type="text" {...register('fullName', { required: 'Full name is required' })} placeholder="John Doe" />
                  {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                    <Input type="email" {...register('email')} placeholder="you@example.com" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Hostel / Department / Meetup Spot*</label>
                  <Input type="text" {...register('addressLine1', { required: 'Pickup point is required' })} placeholder="Girls Hostel, Economics Dept., Library gate..." />
                  {errors.addressLine1 && <p className="text-red-500 text-sm mt-1">{errors.addressLine1.message}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Note</label>
                    <Input type="text" {...register('addressLine2')} placeholder="Preferred time, block, floor, or extra directions" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Nearby Landmark</label>
                    <Input type="text" {...register('landmark')} placeholder="Near canteen, admin block, hostel gate" />
                  </div>
                </div>

                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  Orders on CampusMitra are handled as on-campus meetups. Location will be saved under Gauhati University, Guwahati, Assam.
                </div>

                <Button
                  type="submit"
                  disabled={placeOrderMutation.isPending}
                  className="w-full py-4 text-base shadow-lg shadow-primary-600/20"
                >
                  {placeOrderMutation.isPending ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Place Order'
                  )}
                </Button>
              </form>
              </CardContent>
            </Card>

            <Card className="md:sticky md:top-24 h-fit rounded-2xl border-gray-100 shadow-sm animate-fade-up-delayed">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl md:text-2xl text-gray-900">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-8 pt-2">
              <div className="space-y-6">
                <div className="relative group">
                  <img src={product.images?.[0] || PRODUCT_FALLBACK_IMAGE} alt={product.title} className="w-full h-64 object-cover rounded-xl shadow-sm" onError={setFallbackImage} />
                  {product.isSold && (
                    <Badge variant="destructive" className="absolute top-4 right-4 px-3 py-1 text-sm shadow-sm">
                      Sold
                    </Badge>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{product.title}</h3>
                  <p className="text-gray-600 flex items-center">
                    <MapPin className="w-4 h-4 mr-1.5 text-gray-400" />
                    {getCampusPickupLabel(product.location)}
                  </p>
                </div>
                <div className="bg-gray-50 p-6 rounded-xl space-y-3 border border-gray-100">
                  <div className="flex justify-between text-gray-600">
                    <span>Listing Price</span>
                    <span className="font-medium">{formatPrice(product.price)}</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-600">
                    <span>Quantity</span>
                    <div className="flex items-center rounded-lg border border-gray-200 bg-white p-1">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                        className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-50 text-gray-500 disabled:opacity-30 transition-all"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center font-bold text-gray-800">{quantity}</span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-50 text-gray-500 transition-all"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="h-px bg-gray-200 my-2" />
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total Amount</span>
                    <span className="text-primary-600">{formatPrice((product.price || 0) * quantity)}</span>
                  </div>
                </div>
                <div className="space-y-3 text-sm text-gray-600 bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="font-semibold text-blue-900 mb-2">Listing Owner Contact</p>
                  <div className="flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-blue-500" />
                    {product.contactInfo?.email || 'Email not provided'}
                  </div>
                </div>
              </div>
            </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PlaceOrderPage;
