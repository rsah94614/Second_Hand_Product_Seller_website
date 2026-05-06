import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package } from 'lucide-react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { Button } from '../../../components/ui/Button';
import { usePlaceOrderLogic } from '../hooks/usePlaceOrderLogic';
import { CampusMeetupForm } from '../components/CampusMeetupForm';
import { OrderSummaryCard } from '../components/OrderSummaryCard';

const PlaceOrderPage = () => {
  const navigate = useNavigate();
  const {
    user,
    product,
    isLoading,
    error,
    quantity,
    setQuantity,
    register,
    handleSubmit,
    errors,
    onSubmit,
    totalAmount,
    isPending,
  } = usePlaceOrderLogic();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-white p-8 rounded-xl shadow-md">
          <Package className="w-12 h-12 mx-auto text-primary-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Login to place an order</h2>
          <p className="text-gray-600 mb-6">Please sign in to continue with the checkout process.</p>
          <Link to="/login" className="inline-flex items-center justify-center">
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
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Product unavailable</h2>
          <p className="text-gray-600 mb-6">The product you&apos;re trying to order could not be found.</p>
          <Link to="/products" className="inline-flex items-center justify-center">
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
            <CampusMeetupForm
              register={register}
              errors={errors}
              onSubmit={handleSubmit(onSubmit)}
              isPending={isPending}
            />

            <OrderSummaryCard
              product={product}
              quantity={quantity}
              setQuantity={setQuantity}
              totalAmount={totalAmount}
            />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PlaceOrderPage;
