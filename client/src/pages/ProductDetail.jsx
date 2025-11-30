import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { MapPin, Eye, Calendar, Phone, Mail, User, Edit, Trash2, Share2, ShoppingCart, Minus, Plus, Package, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { assets } from '../assets/assets'
import Header from '../components/Header';
import Footer from '../components/Footer';

import { Button } from '../components/ui/Button';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const queryClient = useQueryClient();

  const { data: product, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await axios.get(import.meta.env.VITE_BACKEND_URL + `/api/products/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  const isAvailable = product && !product.isSold && product.isActive !== false;

  const addToCart = useMutation({
    mutationFn: ({ productId, quantity }) =>
      axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/cart`, {
        productId,
        quantity,
      }),

    onSuccess: () => {
      toast.success('Added to cart');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },

    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    },
  });

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      await axios.delete(import.meta.env.VITE_BACKEND_URL + `/api/products/${id}`);
      toast.success('Product deleted successfully');
      navigate('/my-products');
    } catch (error) {
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
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
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
    if (!product?._id) return;
    addToCart.mutate({ productId: product._id, quantity: 1 });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="h-[500px] bg-gray-200 rounded-2xl"></div>
                <div className="flex space-x-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-24 w-24 bg-gray-200 rounded-xl"></div>
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="h-10 bg-gray-200 rounded w-3/4"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
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

  const isOwner = user && user.id === product.seller._id;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Images */}
            <div className="space-y-6">
              <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100">
                <img
                  src={product.images[currentImageIndex] || '/placeholder-image.jpg'}
                  alt={product.title}
                  className="w-full h-full object-contain p-4"
                  onError={(e) => {
                    e.target.src = assets.img;
                  }}
                />
                {product.isSold && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                    SOLD
                  </div>
                )}
              </div>

              {product.images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all ${currentImageIndex === index
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

            {/* Product Details */}
            <div className="flex flex-col">
              <div className="mb-8">
                <div className="flex items-start justify-between mb-4">
                  <h1 className="text-4xl font-bold text-gray-900 font-display leading-tight">{product.title}</h1>
                  {isOwner && (
                    <div className="flex gap-2">
                      <Link to={`/edit-product/${product._id}`}>
                        <Button variant="outline" size="icon" title="Edit">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button variant="outline" size="icon" className="text-red-600 hover:bg-red-50 hover:border-red-200" onClick={handleDelete} title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <p className="text-3xl font-bold text-primary-600 mb-6">
                  {formatPrice(product.price)}
                </p>

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-8">
                  <div className="flex items-center bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                    <MapPin className="w-4 h-4 mr-2 text-primary-500" />
                    <span>{product.location}</span>
                  </div>
                  <div className="flex items-center bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                    <Calendar className="w-4 h-4 mr-2 text-primary-500" />
                    <span>{formatDate(product.createdAt)}</span>
                  </div>
                  <div className="flex items-center bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                    <Eye className="w-4 h-4 mr-2 text-primary-500" />
                    <span>{product.views} views</span>
                  </div>
                </div>

                <div className="flex gap-3 mb-8">
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    {product.category}
                  </span>
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-100">
                    {product.condition}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Description</h3>
                <div className="prose prose-gray max-w-none">
                  <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{product.description}</p>
                </div>
              </div>

              {/* Seller Info */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Seller Information</h3>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold text-xl">
                    {product.seller.name?.[0] || <User className="w-6 h-6" />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-lg">{product.seller.name}</p>
                    <p className="text-gray-500 text-sm flex items-center mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {product.seller.location || 'Location not available'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {product.contactInfo?.phone && (
                    <a
                      href={`tel:${product.contactInfo.phone}`}
                      className="flex items-center text-gray-600 hover:text-primary-600 transition-colors group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-3 group-hover:bg-primary-50 transition-colors">
                        <Phone className="w-4 h-4" />
                      </div>
                      {product.contactInfo.phone}
                    </a>
                  )}

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
              </div>

              {/* Action Buttons */}
              <div className="mt-auto">
                {!isOwner && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Quantity Selector */}
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button
                          onClick={handleAddToCart}
                          disabled={addToCart.isLoading || !isAvailable}
                          className="flex-1 h-12 text-base"
                          variant="secondary"
                        >
                          {addToCart.isLoading ? (
                            'Adding...'
                          ) : (
                            <>
                              <ShoppingCart className="w-5 h-5 mr-2" />
                              Add to Cart
                            </>
                          )}
                        </Button>

                        <Button
                          onClick={handleOrderNow}
                          disabled={!isAvailable}
                          className="flex-1 h-12 text-base shadow-lg shadow-primary-600/20"
                          variant="primary"
                        >
                          <Package className="w-5 h-5 mr-2" />
                          Order Now
                        </Button>
                      </div>

                      <div className="flex gap-4">
                        <Button
                          onClick={() => navigate('/chat', { state: { sellerId: product.seller._id, sellerName: product.seller.name } })}
                          variant="outline"
                          className="flex-1 h-11"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Chat with Seller
                        </Button>
                        <Button
                          onClick={handleShare}
                          variant="outline"
                          size="icon"
                          className="h-11 w-11 shrink-0"
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
