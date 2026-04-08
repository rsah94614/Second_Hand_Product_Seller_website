import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { MapPin, Calendar, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toggleWishlist } from '../features/users/api/userApi';
import { PRODUCT_FALLBACK_IMAGE, setFallbackImage } from '../lib/fallbackImages';
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
    <Link to={`/products/${product._id}`} className="block h-full group">
      <article className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-gray-100 bg-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.06)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_-10px_rgba(0,0,0,0.12)]">
        <div className="relative overflow-hidden bg-gray-50 aspect-4/3">
          <div className="absolute inset-x-0 top-0 h-32 bg-linear-to-b from-black/40 to-transparent z-10" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-linear-to-t from-black/50 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <img
            src={product.images?.[0] || PRODUCT_FALLBACK_IMAGE}
            alt={product.title}
            className="relative z-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={setFallbackImage}
          />
          {product.isSold && (
            <Badge variant="destructive" className="absolute right-3 top-3 z-20 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] shadow-lg">
              SOLD
            </Badge>
          )}
          {!product.isSold && highlightLabel && (
            <Badge className={`absolute bottom-3 left-3 z-20 border-transparent px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] shadow-lg ${highlightTone}`}>
              {highlightLabel}
            </Badge>
          )}
          <Button
            type="button"
            size="icon"
            variant="outline"
            onClick={handleWishlistClick}
            disabled={wishlistMutation.isPending}
            className={`absolute right-3 top-3 z-20 h-10 w-10 rounded-full border border-white/20 shadow-lg backdrop-blur-md transition-colors ${
              isWishlisted ? 'bg-rose-500 hover:bg-rose-600 text-white border-transparent' : 'bg-white/30 text-white hover:bg-white hover:text-rose-500'
            }`}
            title={isWishlisted ? 'Remove from wishlist' : 'Save product'}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </Button>
        </div>

        <div className="flex flex-1 flex-col px-6 pb-6 pt-5 bg-white relative z-20">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-gray-600">
                  {product.category}
                </span>
                <span className="inline-flex items-center rounded-full bg-primary-100 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-primary-700">
                  {product.condition}
                </span>
              </div>
              <h3 className="line-clamp-2 text-xl font-bold leading-tight tracking-tight text-gray-900 transition-colors">
                {product.title}
              </h3>
            </div>
          </div>

          <p className="mb-4 text-[1.9rem] font-black leading-none tracking-[-0.04em] text-stone-950">
            {formatPrice(product.price)}
          </p>

          <div className="mb-5 flex items-center text-sm font-medium text-stone-600">
            <MapPin className="mr-1.5 h-4 w-4 shrink-0 text-stone-400" />
            <span className="truncate">{product.location}</span>
          </div>

          <div className="mt-auto border-t border-stone-100 pt-4 text-xs text-stone-500">
            <div className="rounded-xl bg-stone-50 px-3 py-2">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
                <Calendar className="h-3.5 w-3.5 text-stone-400" />
                <span>Listed</span>
              </div>
              <span>{formatDate(product.createdAt)}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default ProductCard;
