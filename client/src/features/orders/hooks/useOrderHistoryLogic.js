import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { 
  getOrders, 
  cancelOrder, 
  completeOrder, 
  markOrderDelivered, 
  reportNoShow, 
  uploadConfirmationPhoto, 
  createDispute 
} from '../api/orderApi';

export const useOrderHistoryLogic = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['orders'],
    queryFn: getOrders,
    enabled: !!user,
  });

  const invalidateOrders = () => queryClient.invalidateQueries({ queryKey: ['orders'] });

  const cancelOrderMutation = useMutation({
    mutationFn: (orderId) => cancelOrder(orderId),
    onSuccess: () => {
      toast.success('Order cancelled');
      invalidateOrders();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to cancel order'),
  });

  const completeOrderMutation = useMutation({
    mutationFn: (orderId) => completeOrder(orderId),
    onSuccess: () => {
      toast.success('Receipt confirmed! Deal is complete.');
      invalidateOrders();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to complete order'),
  });

  const deliverOrderMutation = useMutation({
    mutationFn: (orderId) => markOrderDelivered(orderId),
    onSuccess: () => {
      toast.success('Item marked as handed over. Waiting for buyer confirmation.');
      invalidateOrders();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to mark as delivered'),
  });

  const noShowMutation = useMutation({
    mutationFn: (orderId) => reportNoShow(orderId),
    onSuccess: () => {
      toast.success('Reported as No-Show');
      invalidateOrders();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to report no-show'),
  });

  const confirmPhotoMutation = useMutation({
    mutationFn: ({ orderId, formData }) => uploadConfirmationPhoto(orderId, formData),
    onSuccess: () => {
      toast.success('Confirmation photo uploaded');
      invalidateOrders();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to upload photo'),
  });

  const disputeMutation = useMutation({
    mutationFn: ({ orderId, formData }) => createDispute(orderId, formData),
    onSuccess: () => {
      toast.success('Dispute submitted. Our team will review it.');
      invalidateOrders();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit dispute'),
  });

  const handlePhotoUpload = (orderId, file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('photo', file);
    confirmPhotoMutation.mutate({ orderId, formData });
  };

  const handleDispute = (orderId) => {
    const reason = window.prompt('Reason for dispute (e.g. item not as described, no-show, scam):');
    if (!reason?.trim()) return;
    const details = window.prompt('Additional details (optional):') || '';
    const formData = new FormData();
    formData.append('reason', reason.trim());
    formData.append('description', details.trim());
    disputeMutation.mutate({ orderId, formData });
  };

  const handleCancelOrder = (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      cancelOrderMutation.mutate(orderId);
    }
  };

  const handleDeliverOrder = (orderId) => {
    if (window.confirm('Confirm that you have physically handed the item over to the buyer?')) {
      deliverOrderMutation.mutate(orderId);
    }
  };

  const handleCompleteOrder = (orderId) => {
    if (window.confirm('Confirm that you have received the item and the deal is complete?')) {
      completeOrderMutation.mutate(orderId);
    }
  };

  const handleNoShow = (orderId) => {
    if (window.confirm('Are you sure you want to report a No-Show? This affects the seller\'s trust score.')) {
      noShowMutation.mutate(orderId);
    }
  };

  return {
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
    isMutating: 
      cancelOrderMutation.isPending || 
      completeOrderMutation.isPending || 
      deliverOrderMutation.isPending || 
      noShowMutation.isPending || 
      confirmPhotoMutation.isPending || 
      disputeMutation.isPending
  };
};
