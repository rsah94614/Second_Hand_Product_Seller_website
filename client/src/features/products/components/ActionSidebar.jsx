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
  quantity,
  setQuantity,
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
              onClick={() => onAddToCart(quantity)}
              disabled={isAddToCartPending || !isAvailable || isInCart || product.stock === 0}
              className={`flex-1 h-14 text-lg font-bold rounded-2xl ${isInCart ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : ''}`}
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
              className="flex-1 h-14 text-lg font-bold rounded-2xl shadow-xl shadow-primary-600/30 hover:-translate-y-1 transition-transform"
              variant="primary"
            >
              <Package className="w-5 h-5 mr-3" />
              Order Now
            </Button>
          </div>

          <div className="flex flex-col xs:flex-row gap-3">
            <Button
              onClick={onWishlistToggle}
              disabled={isWishlistPending}
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
              onClick={onShare}
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
  );
};
