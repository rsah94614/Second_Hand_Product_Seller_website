import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  MapPin,
  Eye,
  Calendar,
  Mail,
  User,
  Edit,
  Trash2,
  Share2,
  ShoppingCart,
  Package,
  MessageSquare,
  Heart,
  Star,
  Flag,
  Minus,
  Plus,
  PackageCheck,
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { PRODUCT_FALLBACK_IMAGE, setFallbackImage } from '../../../lib/fallbackImages';
import { getCampusPickupLabel } from '../../../lib/campus';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { Textarea } from '../../../components/ui/Textarea';
import ProductCard from '../../../components/ProductCard';
import { API_BASE_URL } from '../../../config/api';
import { deleteProduct, getProduct, getRelatedProducts } from '../api/productApi';
import { submitSellerReview, toggleWishlist, getUserProfile } from '../../users/api/userApi';

const getTrustLabelColor = (colorStr) => {
  const map = {
    green: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    blue: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    gray: 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800',
    emerald: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    amber: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    purple: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  };
  return map[colorStr] || map.gray;
};

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    comment: '',
  });
  const [reportForm, setReportForm] = useState({
    targetType: 'product',
    reason: '',
    details: '',
  });
  const queryClient = useQueryClient();

  const { data: product, isLoading, error } = useQuery({
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

  const isInCart = cartData?.items?.some(item => item.product?._id === id);

  const isAvailable = product && !product.isSold && product.isActive !== false;
  const isWishlisted = Boolean(user?.wishlist?.includes(id));

  const addToCart = useMutation({
    mutationFn: ({ productId, quantity }) =>
      axios.post(`${API_BASE_URL}/api/cart`, {
        productId,
        quantity,
      }),
    onSuccess: () => {
      toast.success('Added to cart');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (mutationError) => {
      toast.error(mutationError.response?.data?.message || 'Failed to add to cart');
    },
  });

  const wishlistMutation = useMutation({
    mutationFn: () => toggleWishlist(id),
    onSuccess: async (response) => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success(response.message);
    },
    onError: (mutationError) => {
      toast.error(mutationError.response?.data?.message || 'Failed to update wishlist');
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (payload) => submitSellerReview(product?.seller?._id, payload),
    onSuccess: async (response) => {
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      toast.success(response.message);
      setReviewForm((prev) => ({ ...prev, comment: '' }));
    },
    onError: (mutationError) => {
      toast.error(mutationError.response?.data?.message || 'Failed to save review');
    },
  });

  const reportMutation = useMutation({
    mutationFn: (payload) => axios.post(`${API_BASE_URL}/api/products/${id}/report`, payload),
    onSuccess: (response) => {
      toast.success(response.data?.message || 'Report submitted successfully');
      setReportForm({
        targetType: 'product',
        reason: '',
        details: '',
      });
    },
    onError: (mutationError) => {
      toast.error(mutationError.response?.data?.message || 'Failed to submit report');
    },
  });

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

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
      navigator.share({
        title: product?.title,
        text: product?.description,
        url: window.location.href,
      });
      return;
    }

    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard');
  };

  const handleOrderNow = () => {
    if (!user) {
      toast.error('Please login to place an order');
      navigate('/login');
      return;
    }

    if (!product?._id || !isAvailable) {
      toast.error('This product is no longer available');
      return;
    }

    navigate(`/order/${product._id}`);
  };

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please login to add products to your cart');
      navigate('/login');
      return;
    }

    if (!product?._id) {
      return;
    }

    addToCart.mutate({ productId: product._id, quantity });
  };

  const handleWishlist = () => {
    if (!user) {
      toast.error('Please login to save products');
      navigate('/login');
      return;
    }

    wishlistMutation.mutate();
  };

  const handleReviewSubmit = (event) => {
    event.preventDefault();

    if (!user) {
      toast.error('Please login to leave a review');
      navigate('/login');
      return;
    }

    reviewMutation.mutate({
      rating: reviewForm.rating,
      comment: reviewForm.comment,
      productId: id,
    });
  };

  const handleReportSubmit = (event) => {
    event.preventDefault();

    if (!user) {
      toast.error('Please login to submit a report');
      navigate('/login');
      return;
    }

    reportMutation.mutate(reportForm);
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);

  const sellerReviews = product?.seller?.reviews || [];
  const existingReview = sellerReviews.find((review) => review.user?._id === user?.id);

  useEffect(() => {
    if (existingReview) {
      setReviewForm({
        rating: existingReview.rating || 5,
        comment: existingReview.comment || '',
      });
      return;
    }

    setReviewForm({
      rating: 5,
      comment: '',
    });
  }, [existingReview]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="h-[280px] sm:h-[400px] md:h-[500px] bg-gray-200 rounded-2xl" />
                <div className="flex space-x-4">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="h-24 w-24 bg-gray-200 rounded-xl" />
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-10 bg-gray-200 rounded w-3/4" />
                <div className="h-8 bg-gray-200 rounded w-1/3" />
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Product Not Found</h1>
            <p className="text-gray-600 mb-8">The product you're looking for doesn't exist or has been removed.</p>
            <Link to="/products">
              <Button variant="primary">Browse Products</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = user && product.seller && user.id === (product.seller?._id ?? product.seller);
  const relatedProducts = (relatedResponse?.products || []).filter((item) => item._id !== product._id);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f4ec_0%,#f8fafc_24%,#f8fafc_100%)]">
      <Header />
      <main className="py-8 lg:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-12">
            <div className="space-y-5">
              <div className="relative w-full overflow-hidden rounded-4xl bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-gray-100" style={{aspectRatio:'1/1'}}>
                <img
                  src={product.images[currentImageIndex] || PRODUCT_FALLBACK_IMAGE}
                  alt={product.title}
                  className="w-full h-full object-contain p-3"
                  onError={setFallbackImage}
                />
                {product.isSold && (
                  <Badge variant="destructive" className="absolute top-6 right-6 px-5 py-2.5 text-sm font-bold tracking-widest shadow-xl">
                    SOLD
                  </Badge>
                )}
              </div>

              {product.images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {product.images.map((image, index) => (
                    <button
                      key={`${image}-${index}`}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all ${
                        currentImageIndex === index
                          ? 'border-primary-600 ring-2 ring-primary-100'
                          : 'border-gray-200 hover:border-primary-300'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col animate-fade-in">
              <div className="mb-8">
                <div className="flex items-start justify-between mb-4">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 leading-tight tracking-tight">{product.title}</h1>
                  {isOwner && (
                    <div className="flex gap-2">
                      <Link to={`/edit-product/${product._id}`}>
                        <Button variant="outline" size="icon" title="Edit">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-red-600 hover:bg-red-50 hover:border-red-200"
                        onClick={handleDelete}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <p className="text-4xl font-black text-primary-600 mb-4">
                  {formatPrice(product.price)}
                </p>

                <div className="flex flex-wrap items-center gap-3 mb-8">
                  <Badge className="border border-blue-100 bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700">
                    {product.condition}
                  </Badge>
                  <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium">
                    {product.category}
                  </Badge>
                  <div className="flex items-center text-sm font-medium text-gray-600 ml-2">
                    <MapPin className="w-4 h-4 mr-1 text-gray-400" />
                    <span>{getCampusPickupLabel(product.seller?.location)}</span>
                  </div>
                </div>

                {product.expiresAt && (Math.ceil((new Date(product.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)) <= 10) && (
                  <p className="text-sm font-bold text-orange-600 mb-6 flex items-center bg-orange-50 p-2 rounded-xl border border-orange-100 animate-pulse">
                    <Calendar className="w-4 h-4 mr-2" />
                    Urgent: This listing expires in {Math.ceil((new Date(product.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))} days!
                  </p>
                )}

                {product.flagged && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex gap-3 text-red-800 text-sm animate-fade-in">
                    <Flag className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
                    <div>
                      <p className="font-bold mb-1">Safety Alert</p>
                      <p>This listing has been flagged by our automated safety systems. Proceed with caution and only meet in public campus locations.</p>
                      {user?.role === 'admin' && <p className="mt-2 text-xs opacity-75">Admin insight: Score {product.riskScore} - {product.flaggedReason}</p>}
                    </div>
                  </div>
                )}
              </div>

<Card className="mb-8 rounded-4xl border-0 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.08)] bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_100%)] relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-primary-200/30 rounded-full blur-3xl" />
                <CardContent className="p-8 relative z-10">
                <h3 className="text-xl font-black tracking-tight text-gray-900 mb-6">Seller</h3>
                <div className="flex items-center gap-5 mb-8">
                  <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold text-xl">
                    {product.seller?.name?.[0] || <User className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{product.seller?.name || 'Unknown Seller'}</p>
                    <p className="text-gray-500 text-sm flex items-center mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {product.seller ? getCampusPickupLabel(product.seller.location) : 'Location unavailable'}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                      <Star className="h-4 w-4 fill-current text-amber-500" />
                      <span>
                        {product.seller?.reviewCount
                          ? `${Number(product.seller.averageRating || 0).toFixed(1)} (${product.seller.reviewCount} review${product.seller.reviewCount === 1 ? '' : 's'})`
                          : 'No seller reviews yet'}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {sellerProfile?.trustSignals?.trustLabels?.map(label => (
                        <Badge key={label.key} className={`border outline-hidden whitespace-nowrap px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase backdrop-blur-md bg-white/10 ${getTrustLabelColor(label.color)}`}>
                          {label.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">

                  {product.contactInfo?.email && (
                    <a
                      href={`mailto:${product.contactInfo.email}`}
                      className="flex items-center text-gray-600 hover:text-primary-600 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 group-hover:bg-primary-50 transition-colors">
                        <Mail className="w-4 h-4" />
                      </div>
                      {product.contactInfo.email}
                    </a>
                  )}
                </div>
                </CardContent>
              </Card>

              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Description</h3>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{product.description}</p>
                </div>
              </div>

              <div className="mt-auto">
                {!isOwner && (
                  <Card className="rounded-t-3xl md:rounded-4xl rounded-b-none md:rounded-b-4xl border-0 shadow-[0_-20px_80px_-20px_rgba(0,0,0,0.12)] sticky bottom-0 md:bottom-6 bg-white/90 backdrop-blur-xl animate-fade-up-delayed p-1 z-40">
                    <CardContent className="p-5">
                    <div className="space-y-4">
                      
                      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex gap-2 items-start text-xs text-indigo-800">
                        <MapPin className="w-4 h-4 shrink-0 text-indigo-600 mt-0.5" />
                        <p><strong>Meetup Tip:</strong> Meet the seller safely on campus. Check the product thoroughly before completing the deal.</p>
                      </div>

                      {!product.isSold && (
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-2">
                          <span className="text-sm font-bold text-gray-700">Quantity</span>
                          <div className="flex items-center gap-4">
                            <button
                              type="button"
                              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                              className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                            >
                              <Minus className="w-4 h-4 text-gray-600" />
                            </button>
                            <span className="text-xl font-black text-gray-900 w-8 text-center">{quantity}</span>
                            <button
                              type="button"
                              onClick={() => setQuantity(prev => prev + 1)}
                              disabled={quantity >= (product.stock || 1)}
                              className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-30"
                            >
                              <Plus className="w-4 h-4 text-gray-600" />
                            </button>
                            {product.stock <= 5 && product.stock > 0 && (
                              <span className="text-[10px] font-bold text-orange-600 ml-2 whitespace-nowrap">
                                Only {product.stock} left!
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                          onClick={handleAddToCart}
                          disabled={addToCart.isPending || !isAvailable || isInCart || product.stock === 0}
                          className={`flex-1 h-14 text-lg font-bold rounded-2xl ${isInCart ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}`}
                          variant={isInCart ? 'outline' : 'secondary'}
                        >
                          {addToCart.isPending ? 'Adding...' : (
                            isInCart ? (
                              <>
                                <PackageCheck className="w-5 h-5 mr-3" />
                                In Cart
                              </>
                            ) : product.stock === 0 ? (
                              'Out of Stock'
                            ) : (
                              <>
                                <ShoppingCart className="w-5 h-5 mr-3" />
                                Add to Cart
                              </>
                            )
                          )}
                        </Button>

                        <Button
                          onClick={handleOrderNow}
                          disabled={!isAvailable}
                          className="flex-1 h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary-600/30 hover:-translate-y-1 transition-transform"
                          variant="primary"
                        >
                          <Package className="w-5 h-5 mr-3" />
                          Order Now
                        </Button>
                      </div>

                      <div className="flex flex-col xs:flex-row gap-3">
                        <Button
                          onClick={handleWishlist}
                          disabled={wishlistMutation.isPending}
                          variant="outline"
                          className="flex-1 h-11 min-w-0"
                        >
                          <Heart className={`w-4 h-4 mr-2 shrink-0 ${isWishlisted ? 'fill-current text-rose-500' : ''}`} />
                          {isWishlisted ? 'Saved' : 'Save Item'}
                        </Button>
                        <Button
                          onClick={() => navigate('/chat', { state: { sellerId: product.seller?._id, sellerName: product.seller?.name || 'Unknown Seller' } })}
                          variant="outline"
                          className="flex-1 h-11 min-w-0"
                          disabled={!product.seller}
                        >
                          <MessageSquare className="w-4 h-4 mr-2 shrink-0" />
                          Message Seller
                        </Button>
                        <Button
                          onClick={handleShare}
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 shrink-0 self-end xs:self-auto"
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>

        {/* Secondary Info: Reviews & Report */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div className="space-y-8">


              <Card className="rounded-2xl border-gray-100 shadow-sm animate-fade-up-delayed">
                <CardContent className="p-6">
                  <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Seller Ratings & Reviews</h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {product.seller?.reviewCount || 0} review{product.seller?.reviewCount === 1 ? '' : 's'} about this seller
                      </p>
                    </div>
                    <div className="flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-amber-700">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-semibold">{product.seller?.averageRating || 0}/5</span>
                    </div>
                  </div>

                  {!isOwner && product.seller && (
                    <form onSubmit={handleReviewSubmit} className="mb-6 rounded-2xl border border-gray-100 bg-gray-50 p-4">
                      <div className="mb-4">
                        <p className="mb-2 text-sm font-semibold text-gray-800">
                          {existingReview ? 'Update your seller review' : 'Review this seller'}
                        </p>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => setReviewForm((prev) => ({ ...prev, rating }))}
                              className="rounded-full p-1 text-amber-500 transition-transform hover:scale-110"
                            >
                              <Star className={`h-5 w-5 ${rating <= reviewForm.rating ? 'fill-current' : ''}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                      <Textarea
                        value={reviewForm.comment}
                        onChange={(event) => setReviewForm((prev) => ({ ...prev, comment: event.target.value }))}
                        placeholder="Share how the seller communicated, accuracy of the listing, and overall experience."
                        className="mb-4 bg-white"
                      />
                      <Button type="submit" disabled={reviewMutation.isPending}>
                        {reviewMutation.isPending ? 'Saving...' : existingReview ? 'Update Seller Review' : 'Submit Seller Review'}
                      </Button>
                    </form>
                  )}

                  {sellerReviews.length ? (
                    <div className="space-y-4">
                      {sellerReviews.map((review) => (
                        <div key={review._id} className="rounded-2xl border border-gray-100 p-4">
                          <div className="mb-2 flex items-center justify-between gap-4">
                            <div>
                              <p className="font-semibold text-gray-900">{review.user?.name || 'Anonymous user'}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(review.updatedAt || review.createdAt).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-amber-500">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star key={star} className={`h-4 w-4 ${star <= review.rating ? 'fill-current' : ''}`} />
                              ))}
                            </div>
                          </div>
                          <p className="text-sm leading-relaxed text-gray-600">
                            {review.comment || 'No written feedback provided.'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-gray-500">
                      No seller reviews yet. Be the first to share feedback about this seller.
                    </div>
                  )}
                </CardContent>
              </Card>
          </div>
          <div className="space-y-8">


              {!isOwner && (
                <Card className="rounded-2xl border-gray-100 shadow-sm animate-fade-up-delayed">
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center gap-2 text-gray-900">
                      <Flag className="h-5 w-5 text-red-600" />
                      <h3 className="text-lg font-bold">Report Listing or Owner</h3>
                    </div>
                    <p className="mb-4 text-sm text-gray-600">
                      Flag misleading, unsafe, abusive, or fraudulent behavior so admin can review it.
                    </p>
                    <form onSubmit={handleReportSubmit} className="space-y-4">
                      <div className="flex flex-col gap-3 sm:flex-row">
                        <Button
                          type="button"
                          variant={reportForm.targetType === 'product' ? 'primary' : 'outline'}
                          onClick={() => setReportForm((prev) => ({ ...prev, targetType: 'product' }))}
                        >
                          Report Listing
                        </Button>
                        {product.seller && (
                          <Button
                            type="button"
                            variant={reportForm.targetType === 'user' ? 'primary' : 'outline'}
                            onClick={() => setReportForm((prev) => ({ ...prev, targetType: 'user' }))}
                          >
                            Report Owner
                          </Button>
                        )}
                      </div>
                      <Textarea
                        value={reportForm.reason}
                        onChange={(event) => setReportForm((prev) => ({ ...prev, reason: event.target.value }))}
                        placeholder="Short reason, for example: spam listing, fake photos, abusive behavior"
                        className="min-h-[84px] bg-white"
                      />
                      <Textarea
                        value={reportForm.details}
                        onChange={(event) => setReportForm((prev) => ({ ...prev, details: event.target.value }))}
                        placeholder="Optional extra details for the admin team"
                        className="min-h-[120px] bg-white"
                      />
                      <Button type="submit" variant="destructive" disabled={reportMutation.isPending}>
                        {reportMutation.isPending ? 'Submitting...' : 'Submit Report'}
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              )}
          </div>
        </div>

        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Similar Items</h2>
                <p className="mt-2 text-gray-600">
                  Similar listings based on category, price range, popularity, and rating.
                </p>
              </div>
              <Link to={`/products?category=${encodeURIComponent(product.category)}`}>
                <Button variant="outline">Explore More</Button>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 animate-fade-in">
              {relatedProducts.slice(0, 4).map((relatedProduct) => (
                <ProductCard key={relatedProduct._id} product={relatedProduct} />
              ))}
            </div>
          </section>
        )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetailPage;
