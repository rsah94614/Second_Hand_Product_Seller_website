import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { getCampusShippingDefaults } from '../../../lib/campus';
import { getProduct } from '../../products/api/productApi';
import { placeOrder } from '../api/orderApi';

export const usePlaceOrderLogic = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);

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

  const totalAmount = (product?.price || 0) * quantity;

  return {
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
    isPending: placeOrderMutation.isPending,
  };
};
