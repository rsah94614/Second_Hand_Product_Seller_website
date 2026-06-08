import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Minus, 
  Plus, 
  ShoppingCart, 
  Package, 
  PackageCheck, 
  Heart, 
  MessageSquare, 
  Share2, 
  MapPin 
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';

export const ActionSidebar = ({
  product,
  isAvailable,
  isInCart,
  isWishlisted,
  isOwner,
  onAddToCart,
  onOrderNow,
  onWishlistToggle,
  onShare,
  isAddToCartPending,
  isWishlistPending,
}) => {
  const navigate = useNavigate();

  if (isOwner) return null;

  return (
    <div className="space-y-4">
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 flex gap-3 items-start text-sm text-indigo-800">
        <MapPin className="w-5 h-5 shrink-0 text-indigo-600 mt-0.5" />
        <p><strong>Meetup Tip:</strong> Meet the seller safely on campus. Check the product thoroughly before completing the deal.</p>
      </div>



      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <Button
            onClick={() => onAddToCart()}
            disabled={isAddToCartPending || !isAvailable || isInCart || product.stock === 0}
            className={`flex-1 h-16 text-lg font-bold rounded-2xl ${isInCart ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-gray-900 text-white hover:bg-gray-800 shadow-xl shadow-gray-900/20'}`}
            variant={isInCart ? 'outline' : 'secondary'}
          >
            {isAddToCartPending ? 'Adding...' : (
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
            onClick={onOrderNow}
            disabled={!isAvailable}
            className="flex-1 h-16 text-lg font-black rounded-2xl shadow-xl shadow-primary-600/30 hover:-translate-y-1 transition-transform bg-primary-600 hover:bg-primary-700 text-white"
            variant="primary"
          >
            <Package className="w-5 h-5 mr-3" />
            Order Now
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={onWishlistToggle}
            disabled={isWishlistPending}
            variant="outline"
            className="flex-1 h-12 min-w-0 rounded-xl font-bold border-gray-200 hover:bg-gray-50"
          >
            <Heart className={`w-4 h-4 mr-2 shrink-0 ${isWishlisted ? 'fill-current text-rose-500' : ''}`} />
            {isWishlisted ? 'Saved' : 'Save Item'}
          </Button>
          <Button
            onClick={() => navigate('/chat', { state: { sellerId: product.seller?._id, sellerName: product.seller?.name || 'Unknown Seller' } })}
            variant="outline"
            className="flex-1 h-12 min-w-0 rounded-xl font-bold border-gray-200 hover:bg-gray-50"
            disabled={!product.seller}
          >
            <MessageSquare className="w-4 h-4 mr-2 shrink-0" />
            Message Seller
          </Button>
          <Button
            onClick={onShare}
            variant="outline"
            size="icon"
            className="h-12 w-12 shrink-0 rounded-xl border-gray-200 hover:bg-gray-50"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
