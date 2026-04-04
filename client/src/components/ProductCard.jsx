import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { MapPin, Eye, Calendar, Heart, Star, ArrowUpRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toggleWishlist } from '../features/users/api/userApi';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

const ProductCard = ({ product, highlightLabel = '', highlightTone = 'bg-primary-600 text-white' }) => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isWishlisted = Boolean(user?.wishlist?.includes(product._id));
  const hasRating = Number(product.averageRating) > 0;

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
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-[linear-gradient(180deg,#fffdf8_0%,#ffffff_100%)] shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition-all duration-500 hover:-translate-y-2 hover:border-stone-300 hover:shadow-[0_26px_70px_rgba(15,23,42,0.16)]">
        <div className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.18),transparent_36%),linear-gradient(135deg,#f8fafc_0%,#f6f2e9_48%,#ffffff_100%)] aspect-[4/3] p-4 sm:p-5">
          <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-white/80 to-transparent" />
          <div className="absolute inset-x-6 bottom-5 h-10 rounded-full bg-black/10 blur-2xl" />
          <img
            src={product.images[0] || '/placeholder-image.jpg'}
            alt={product.title}
            className="relative z-10 h-full w-full object-contain transition-transform duration-500 group-hover:scale-[1.06]"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/400x400?text=No+Image';
            }}
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
            className={`absolute left-3 top-3 z-20 h-10 w-10 rounded-full border-white/80 bg-white/95 shadow-md backdrop-blur hover:bg-white ${
              isWishlisted ? 'text-rose-500' : 'text-gray-500'
            }`}
            title={isWishlisted ? 'Remove from wishlist' : 'Save product'}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
          </Button>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-linear-to-t from-stone-900/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-100/70 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-stone-600">
                  {product.category}
                </span>
                <span className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-primary-700">
                  {product.condition}
                </span>
              </div>
              <h3 className="line-clamp-2 text-[1.08rem] font-black leading-[1.15] tracking-[-0.02em] text-stone-950 transition-colors group-hover:text-primary-700">
                {product.title}
              </h3>
            </div>
            <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-stone-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary-600" />
          </div>

          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-stone-400">
                Asking Price
              </p>
              <p className="mt-1 text-[1.9rem] font-black leading-none tracking-[-0.04em] text-stone-950">
                {formatPrice(product.price)}
              </p>
            </div>
            {hasRating && (
              <div className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 shadow-sm">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span>{Number(product.averageRating).toFixed(1)}</span>
                <span className="text-amber-600/80">({product.reviewCount || 0})</span>
              </div>
            )}
          </div>

          <div className="mb-5 flex items-center text-sm font-medium text-stone-600">
            <MapPin className="mr-1.5 h-4 w-4 shrink-0 text-stone-400" />
            <span className="truncate">{product.location}</span>
          </div>

          <div className="mt-auto grid grid-cols-2 gap-3 border-t border-stone-100 pt-4 text-xs text-stone-500">
            <div className="rounded-xl bg-stone-50 px-3 py-2">
              <div className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
                <Calendar className="h-3.5 w-3.5 text-stone-400" />
                <span>Listed</span>
              </div>
              <span>{formatDate(product.createdAt)}</span>
            </div>
            <div className="rounded-xl bg-stone-50 px-3 py-2 text-right">
              <div className="mb-1 flex items-center justify-end gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-400">
                <Eye className="h-3.5 w-3.5 text-stone-400" />
                <span>Views</span>
              </div>
              <span>{product.views || 0}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default ProductCard;
