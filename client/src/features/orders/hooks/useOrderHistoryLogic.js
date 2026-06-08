import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { 
  getOrders, 
  cancelOrder, 
  acceptOrder,
  scheduleMeetup,
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

  const acceptOrderMutation = useMutation({
    mutationFn: (orderId) => acceptOrder(orderId),
    onSuccess: () => {
      toast.success('Order accepted');
      invalidateOrders();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to accept order'),
  });

  const scheduleMeetupMutation = useMutation({
    mutationFn: ({ orderId, location, scheduledAt, notes }) => scheduleMeetup(orderId, { location, scheduledAt, notes }),
    onSuccess: () => {
      toast.success('Meetup scheduled');
      invalidateOrders();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to schedule meetup'),
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
    const reasonMap = {
      '1': 'damaged',
      '2': 'not_received',
      '3': 'not_as_described',
      '4': 'other',
    };
    const reasonChoice = window.prompt(
      'Choose dispute reason (Please enter the number 1, 2, 3, or 4):\n\n' +
      '1. Item damaged\n' +
      '2. Item not received\n' +
      '3. Not as described\n' +
      '4. Other'
    );
    
    if (reasonChoice === null) return; // User cancelled the prompt

    const cleanChoice = reasonChoice.trim();
    let resolvedChoice = null;
    
    // Match starting digit if user typed e.g. "1" or "1. Item damaged"
    const digitMatch = cleanChoice.match(/^[1-4]/);
    if (digitMatch) {
      resolvedChoice = digitMatch[0];
    } else {
      // Fallback: match by keyword if user typed the text instead of the number
      const lowercase = cleanChoice.toLowerCase();
      if (lowercase.includes('damage')) resolvedChoice = '1';
      else if (lowercase.includes('receive') || lowercase.includes('not_received') || lowercase.includes('no receipt')) resolvedChoice = '2';
      else if (lowercase.includes('describe') || lowercase.includes('description')) resolvedChoice = '3';
      else if (lowercase.includes('other')) resolvedChoice = '4';
    }

    const reason = reasonMap[resolvedChoice];
    if (!reason) {
      toast.error('Please choose a valid dispute reason (enter 1, 2, 3, or 4).');
      return;
    }
    const details = window.prompt('Describe what happened. This is required for review.');
    if (details === null) return; // User cancelled the prompt
    
    if (!details.trim()) {
      toast.error('Please provide dispute details.');
      return;
    }
    const formData = new FormData();
    formData.append('reason', reason);
    formData.append('description', details.trim());
    disputeMutation.mutate({ orderId, formData });
  };

  const handleCancelOrder = (orderId) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      cancelOrderMutation.mutate(orderId);
    }
  };

  const handleAcceptOrder = (orderId) => {
    acceptOrderMutation.mutate(orderId);
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
    handleAcceptOrder,
    handleDeliverOrder,
    handleCompleteOrder,
    handleNoShow,
    handlePhotoUpload,
    handleDispute,
    scheduleMeetupMutation,
    isMutating: 
      cancelOrderMutation.isPending || 
      acceptOrderMutation.isPending ||
      scheduleMeetupMutation.isPending ||
      completeOrderMutation.isPending || 
      deliverOrderMutation.isPending || 
      noShowMutation.isPending || 
      confirmPhotoMutation.isPending || 
      disputeMutation.isPending
  };
};
