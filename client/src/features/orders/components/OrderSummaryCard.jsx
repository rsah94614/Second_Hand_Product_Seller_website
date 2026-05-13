import React from 'react';
import { MapPin, Mail, Minus, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { PRODUCT_FALLBACK_IMAGE, setFallbackImage } from '../../../lib/fallbackImages';
import { getCampusPickupLabel } from '../../../lib/campus';

const formatPrice = (price = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);

export const OrderSummaryCard = ({ product, quantity, setQuantity, totalAmount }) => {
  return (
    <Card className="md:sticky md:top-24 h-fit rounded-2xl border-gray-100 shadow-sm animate-fade-up-delayed">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl md:text-2xl text-gray-900">Order Summary</CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-8 pt-2">
        <div className="space-y-6">
          <div className="relative group">
            <img 
              src={product.images?.[0] || PRODUCT_FALLBACK_IMAGE} 
              alt={product.title} 
              className="w-full h-64 object-cover rounded-xl shadow-sm" 
              onError={setFallbackImage} 
            />
            {product.isSold && (
              <Badge variant="destructive" className="absolute top-4 right-4 px-3 py-1 text-sm shadow-sm">
                Sold
              </Badge>
            )}
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{product.title}</h3>
            <p className="text-gray-600 flex items-center">
              <MapPin className="w-4 h-4 mr-1.5 text-gray-400" />
              {getCampusPickupLabel(product.location)}
            </p>
          </div>
          <div className="bg-gray-50 p-6 rounded-xl space-y-3 border border-gray-100">
            <div className="flex justify-between text-gray-600">
              <span>Listing Price</span>
              <span className="font-medium">{formatPrice(product.price)}</span>
            </div>
            <div className="flex justify-between items-center text-gray-600">
              <span>Quantity</span>
              <div className="flex items-center rounded-lg border border-gray-200 bg-white p-1">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-50 text-gray-500 disabled:opacity-30 transition-all"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center font-bold text-gray-800">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  disabled={quantity >= (product.stock || 99)}
                  className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-50 text-gray-500 transition-all disabled:opacity-30"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="h-px bg-gray-200 my-2" />
            <div className="flex justify-between text-lg font-bold text-gray-900">
              <span>Total Amount</span>
              <span className="text-primary-600">{formatPrice(totalAmount)}</span>
            </div>
          </div>
          <div className="space-y-3 text-sm text-gray-600 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <p className="font-semibold text-blue-900 mb-2">Listing Owner Contact</p>
            <div className="flex items-center">
              <Mail className="w-4 h-4 mr-2 text-blue-500" />
              {product.contactInfo?.email || 'Email not provided'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
