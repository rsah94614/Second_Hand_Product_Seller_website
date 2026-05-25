import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { History, ShoppingBag, Tag, Info } from 'lucide-react';
import { OrderFlowInfoModal } from '../components/OrderFlowInfoModal';


import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { Button } from '../../../components/ui/Button';
import { ErrorState } from '../../../components/ui/ErrorState';
import { useOrderHistoryLogic } from '../hooks/useOrderHistoryLogic';
import { OrderHistoryCard } from '../components/OrderHistoryCard';
import { OrderEmptyState } from '../components/OrderEmptyState';
import { ScheduleMeetupModal } from '../components/ScheduleMeetupModal';

const OrderHistoryPage = () => {
  const {
    user,
    orders,
    isLoading,
    isError,
    refetch,
    handleCancelOrder,
    handleAcceptOrder,
    handleDeliverOrder,
    handleCompleteOrder,
    handleNoShow,
    handlePhotoUpload,
    handleDispute,
    scheduleMeetupMutation,
    isMutating,
  } = useOrderHistoryLogic();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('buying');
  const [scheduleOrderId, setScheduleOrderId] = useState(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const buyerId = o.user?._id || o.user;
      const sellerId = o.seller?._id || o.seller;
      if (activeTab === 'buying') return buyerId === user?.id;
      return sellerId === user?.id;
    });
  }, [orders, activeTab, user]);

  const handleReviewOrder = (order) => {
    const sellerId = order.seller?._id || order.seller;
    navigate(`/review/${sellerId}?orderId=${order._id}`);
  };

  const handleMessage = (order) => {
    const buyerId = order.user?._id || order.user;
    const sellerId = order.seller?._id || order.seller;
    const sellerName = order.seller?.name;
    const buyerName = order.user?.name;
    const otherUserId = buyerId === user?.id ? sellerId : buyerId;
    const otherUserName = buyerId === user?.id ? sellerName : buyerName;
    navigate(`/chat/${otherUserId}`, {
      state: otherUserName
        ? { sellerId: otherUserId, sellerName: otherUserName }
        : undefined,
    });
  };

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
    onAccept: handleAcceptOrder,
    onSchedule: setScheduleOrderId,
    onDeliver: handleDeliverOrder,
    onComplete: handleCompleteOrder,
    onNoShow: handleNoShow,
    onPhotoUpload: handlePhotoUpload,
    onDispute: handleDispute,
    onReview: handleReviewOrder,
    onMessage: handleMessage,
    isMutating,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-gray-900 flex items-center tracking-tight">
              <History className="w-8 h-8 mr-4 text-primary-600" />
              My Orders
            </h1>
            <p className="text-gray-500 mt-2 text-lg">
              Manage your campus deals and track the fulfillment process in real-time.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div className="flex bg-gray-100 p-1.5 rounded-2xl w-full sm:max-w-sm">
              <button
                onClick={() => setActiveTab('buying')}
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center transition-all ${
                  activeTab === 'buying'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Buying
              </button>
              <button
                onClick={() => setActiveTab('selling')}
                className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center transition-all ${
                  activeTab === 'selling'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Tag className="w-4 h-4 mr-2" />
                Selling
              </button>
            </div>
            <Button 
              variant="outline" 
              className="gap-2 rounded-xl text-primary-600 border-primary-200 hover:bg-primary-50 bg-white shadow-sm font-semibold"
              onClick={() => setIsInfoModalOpen(true)}
            >
              <Info className="w-4 h-4" />
              How it works
            </Button>
          </div>

          {filteredOrders.length === 0 ? (
            <OrderEmptyState activeTab={activeTab} />
          ) : (
            <div className="space-y-8">
              {filteredOrders.map((order) => (
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

      <ScheduleMeetupModal
        isOpen={!!scheduleOrderId}
        onClose={() => setScheduleOrderId(null)}
        isMutating={scheduleMeetupMutation.isPending}
        onSubmit={(data) => {
          scheduleMeetupMutation.mutate(
            { orderId: scheduleOrderId, ...data },
            { onSuccess: () => setScheduleOrderId(null) }
          );
        }}
      />

      <OrderFlowInfoModal 
        isOpen={isInfoModalOpen} 
        onClose={() => setIsInfoModalOpen(false)} 
        activeTab={activeTab} 
      />
    </div>
  );
};

export default OrderHistoryPage;
