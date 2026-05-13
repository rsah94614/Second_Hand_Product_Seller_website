import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { Button } from '../../../components/ui/Button';
import { ErrorState } from '../../../components/ui/ErrorState';
import { useCartLogic } from '../hooks/useCartLogic';
import { CartItem } from '../components/CartItem';
import { CartSummary } from '../components/CartSummary';
import { CheckoutDialog } from '../components/CheckoutDialog';
import { EmptyCart } from '../components/EmptyCart';

const CartPage = () => {
  const {
    user,
    items,
    summary,
    isLoading,
    isError,
    isAddressModalOpen,
    shippingDetails,
    hasUnavailableItems,
    checkoutPending,
    setIsAddressModalOpen,
    setShippingDetails,
    removeItem,
    updateQuantity,
    handleCheckout,
    refetch,
  } = useCartLogic();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-white p-8 rounded-xl shadow-md">
          <ShoppingCart className="w-12 h-12 mx-auto text-primary-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Login to view your cart</h2>
          <p className="text-gray-600 mb-6">Your cart items are saved to your account. Please login to continue shopping.</p>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 animate-pulse">
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
              {summary.itemCount} item{summary.itemCount === 1 ? '' : 's'} in your cart
            </p>
          </div>

          {items.length === 0 ? (
            <EmptyCart />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                {items.map((item, index) => (
                  <CartItem
                    key={item._id || `${item.product?._id || 'unknown'}-${index}`}
                    item={item}
                    onRemove={removeItem}
                    onUpdateQuantity={updateQuantity}
                  />
                ))}
              </div>

              <CartSummary
                summary={summary}
                hasUnavailableItems={hasUnavailableItems}
                onCheckout={() => setIsAddressModalOpen(true)}
                isPending={checkoutPending}
              />
            </div>
          )}
        </div>
      </div>
      <Footer />

      <CheckoutDialog
        isOpen={isAddressModalOpen}
        onOpenChange={setIsAddressModalOpen}
        shippingDetails={shippingDetails}
        onDetailsChange={setShippingDetails}
        onConfirm={handleCheckout}
        isPending={checkoutPending}
      />
    </div>
  );
};

export default CartPage;
