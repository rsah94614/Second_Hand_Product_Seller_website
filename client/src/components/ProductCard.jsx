import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { MapPin, Eye, Calendar, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toggleWishlist } from '../features/users/api/userApi';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

const ProductCard = ({ product, highlightLabel = '', highlightTone = 'bg-primary-600 text-white' }) => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isWishlisted = Boolean(user?.wishlist?.includes(product._id));

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
      month: 'short',
      year: 'numeric',
    });
  };

  const wishlistMutation = useMutation({
    mutationFn: () => toggleWishlist(product._id),
    onSuccess: async (response) => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
      toast.success(response.message);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update wishlist');
    },
  });

  const handleWishlistClick = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!user) {
      toast.error('Please login to save products');
      navigate('/login');
      return;
    }

    wishlistMutation.mutate();
  };

  return (
    <Link to={`/products/${product._id}`} className="block group">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
        <div className="relative overflow-hidden bg-gray-50 aspect-square p-4">
          <img
            src={product.images[0] || '/placeholder-image.jpg'}
            alt={product.title}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x400?text=No+Image';
            }}
          />
          {product.isSold && (
            <Badge variant="destructive" className="absolute top-3 right-3 px-3 py-1.5 text-xs font-bold shadow-lg">
              SOLD
            </Badge>
          )}
          {!product.isSold && highlightLabel && (
            <Badge className={`absolute bottom-3 left-3 border-transparent px-3 py-1.5 text-xs font-bold shadow-lg ${highlightTone}`}>
              {highlightLabel}
            </Badge>
          )}
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={handleWishlistClick}
            disabled={wishlistMutation.isPending}
            className={`absolute top-3 left-3 h-10 w-10 rounded-full border-white/80 bg-white/95 shadow-md hover:bg-white ${
              isWishlisted ? 'text-rose-500' : 'text-gray-500'
            }`}
            title={isWishlisted ? 'Remove from wishlist' : 'Save product'}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </Button>
          <div className="absolute inset-0 bg-linear-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>

        <div className="p-5">
          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors leading-snug">
            {product.title}
          </h3>

          <p className="text-2xl font-bold text-primary-600 mb-4">
            {formatPrice(product.price)}
          </p>

          <div className="flex items-center text-gray-600 text-sm mb-4">
            <MapPin className="w-4 h-4 mr-1.5 shrink-0 text-gray-400" />
            <span className="truncate">{product.location}</span>
          </div>

          <div className="flex items-center justify-between text-gray-500 text-xs mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
              <span>{formatDate(product.createdAt)}</span>
            </div>
            <div className="flex items-center">
              <Eye className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
              <span>{product.views || 0}</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium">
              {product.category}
            </span>
            <span className="inline-flex items-center bg-primary-50 text-primary-700 px-3 py-1 rounded-full text-xs font-medium border border-primary-100">
              {product.condition}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
