import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config/api';
import { deleteProduct, getProduct, getRelatedProducts } from '../api/productApi';
import { submitSellerReview, toggleWishlist, getUserProfile } from '../../users/api/userApi';

export const useProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reportForm, setReportForm] = useState({ targetType: 'product', reason: '', details: '' });

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: product, isLoading, error, refetch } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id),
    enabled: !!id,
  });

  const { data: relatedResponse } = useQuery({
    queryKey: ['related-products', id],
    queryFn: () => getRelatedProducts(id),
    enabled: !!id,
  });

  const { data: sellerProfile } = useQuery({
    queryKey: ['user-profile', product?.seller?._id],
    queryFn: () => getUserProfile(product.seller._id),
    enabled: !!product?.seller?._id,
  });

  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: () => axios.get(`${API_BASE_URL}/api/cart`).then((res) => res.data),
    enabled: !!user,
  });

  // ── Computed State ───────────────────────────────────────────────────────
  const isInCart = cartData?.items?.some(item => item.product?._id === id);
  const isAvailable = product && !product.isSold && product.isActive !== false;
  const isWishlisted = Boolean(user?.wishlist?.includes(id));
  const isOwner = user && product?.seller && user.id === (product.seller?._id ?? product.seller);
  const relatedProducts = (relatedResponse?.products || []).filter((item) => item._id !== id);
  const sellerReviews = product?.seller?.reviews || [];
  const existingReview = sellerReviews.find((review) => review.user?._id === user?.id);

  // ── Effects ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (existingReview) {
      setReviewForm({
        rating: existingReview.rating || 5,
        comment: existingReview.comment || '',
      });
    } else {
      setReviewForm({ rating: 5, comment: '' });
    }
  }, [existingReview]);

  // ── Mutations ────────────────────────────────────────────────────────────
  const addToCart = useMutation({
    mutationFn: ({ productId, quantity }) => {
      if (isOwner) return Promise.reject(new Error('You cannot add your own listing to your cart'));
      return axios.post(`${API_BASE_URL}/api/cart`, { productId, quantity });
    },
    onSuccess: () => {
      toast.success('Added to cart');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (err) => toast.error(err.response?.data?.message || err.message || 'Failed to add to cart'),
  });

  const wishlistMutation = useMutation({
    mutationFn: () => toggleWishlist(id),
    onSuccess: async (res) => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success(res.message);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to update wishlist'),
  });

  const reviewMutation = useMutation({
    mutationFn: (payload) => submitSellerReview(product?.seller?._id, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      toast.success(res.message);
      setReviewForm(prev => ({ ...prev, comment: '' }));
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to save review'),
  });

  const reportMutation = useMutation({
    mutationFn: (payload) => axios.post(`${API_BASE_URL}/api/products/${id}/report`, payload),
    onSuccess: (res) => {
      toast.success(res.data?.message || 'Report submitted successfully');
      setReportForm({ targetType: 'product', reason: '', details: '' });
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to submit report'),
  });

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      toast.success('Product deleted successfully');
      navigate('/my-products');
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product?.title, text: product?.description, url: window.location.href });
      return;
    }
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    reviewMutation.mutate({ rating: reviewForm.rating, comment: reviewForm.comment, productId: id });
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    reportMutation.mutate(reportForm);
  };

  return {
    id,
    user,
    product,
    isLoading,
    error,
    relatedProducts,
    sellerProfile,
    currentImageIndex,
    setCurrentImageIndex,
    quantity,
    setQuantity,
    reviewForm,
    setReviewForm,
    reportForm,
    setReportForm,
    isInCart,
    isAvailable,
    isWishlisted,
    isOwner,
    sellerReviews,
    existingReview,
    handleDelete,
    handleShare,
    handleReviewSubmit,
    handleReportSubmit,
    addToCart: (q) => addToCart.mutate({ productId: id, quantity: q }),
    toggleWishlist: () => wishlistMutation.mutate(),
    refetch,
    isReviewPending: reviewMutation.isPending,
    isReportPending: reportMutation.isPending,
    isAddToCartPending: addToCart.isPending,
    isWishlistPending: wishlistMutation.isPending,
  };
};
