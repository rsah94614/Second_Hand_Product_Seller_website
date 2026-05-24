import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config/api';
import { getCampusShippingDefaults } from '../../../lib/campus';

export const useCartLogic = () => {
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
      axios.delete(`${API_BASE_URL}/api/cart/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      toast.success('Item removed from cart');
    },
    onError: () => {
      toast.error('Unable to remove item. Please try again.');
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

  const handleCheckout = () => {
    if (!validateShippingDetails()) return;
    checkout.mutate({
      ...shippingDetails,
      ...getCampusShippingDefaults(),
    });
  };

  const items = data?.items || [];
  const summary = data?.summary || { itemCount: 0, totalAmount: 0 };
  const hasUnavailableItems = items.some(
    (item) => !item.product || item.product.isSold || item.product.isActive === false
  );

  return {
    user,
    items,
    summary,
    isLoading,
    isError,
    isAddressModalOpen,
    shippingDetails,
    hasUnavailableItems,
    checkoutPending: checkout.isPending,
    setIsAddressModalOpen,
    setShippingDetails,
    removeItem: removeItem.mutate,
    handleCheckout,
    refetch,
  };
};
