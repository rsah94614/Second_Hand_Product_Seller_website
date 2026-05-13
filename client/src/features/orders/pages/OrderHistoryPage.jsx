import React from 'react';
import { Link } from 'react-router-dom';
import { History } from 'lucide-react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { Button } from '../../../components/ui/Button';
import { ErrorState } from '../../../components/ui/ErrorState';
import { useOrderHistoryLogic } from '../hooks/useOrderHistoryLogic';
import { OrderHistoryCard } from '../components/OrderHistoryCard';
import { OrderEmptyState } from '../components/OrderEmptyState';

const OrderHistoryPage = () => {
  const {
    user,
    orders,
    isLoading,
    isError,
    refetch,
    handleCancelOrder,
    handleDeliverOrder,
    handleCompleteOrder,
    handleNoShow,
    handlePhotoUpload,
    handleDispute,
    isMutating,
  } = useOrderHistoryLogic();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center bg-white p-10 rounded-3xl shadow-xl border border-gray-100">
          <History className="w-16 h-16 mx-auto text-primary-600 mb-6" />
          <h2 className="text-2xl font-black text-gray-900 mb-3">View your orders</h2>
          <p className="text-gray-600 mb-8">Track your purchases and manage your campus deals once you&apos;re signed in.</p>
          <Link to="/login">
            <Button variant="primary" className="w-full rounded-full h-12 text-base font-bold">Go to Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 space-y-6">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 animate-pulse space-y-4">
              <div className="h-8 w-1/4 bg-gray-100 rounded-full" />
              <div className="h-4 w-1/3 bg-gray-100 rounded-full" />
              <div className="h-32 w-full bg-gray-50 rounded-2xl" />
            </div>
          ))}
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

  const actions = {
    onCancel: handleCancelOrder,
    onDeliver: handleDeliverOrder,
    onComplete: handleCompleteOrder,
    onNoShow: handleNoShow,
    onPhotoUpload: handlePhotoUpload,
    onDispute: handleDispute,
    isMutating,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h1 className="text-3xl font-black text-gray-900 flex items-center tracking-tight">
              <History className="w-8 h-8 mr-4 text-primary-600" />
              Order History
            </h1>
            <p className="text-gray-500 mt-2 text-lg">
              Manage your campus deals and track the fulfillment process in real-time.
            </p>
          </div>

          {orders.length === 0 ? (
            <OrderEmptyState />
          ) : (
            <div className="space-y-8">
              {orders.map((order) => (
                <OrderHistoryCard 
                  key={order._id} 
                  order={order} 
                  user={user} 
                  actions={actions} 
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderHistoryPage;
