import React from 'react';
import { Trash2 } from 'lucide-react';
import { PRODUCT_FALLBACK_IMAGE, setFallbackImage } from '../../../lib/fallbackImages';
import { getCampusPickupLabel } from '../../../lib/campus';

const formatPrice = (price = 0) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);

export const CartItem = ({ item, onRemove }) => {
  const isItemUnavailable = !item.product || item.product.isSold || item.product.isActive === false;

  return (
    <div
      className={`p-6 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-6 group transition-shadow ${
        isItemUnavailable ? 'opacity-60 bg-gray-50/50' : 'hover:shadow-md'
      }`}
    >
      <div className="relative w-full sm:w-32 h-32 shrink-0">
        <img
          src={item.product?.images?.[0] || PRODUCT_FALLBACK_IMAGE}
          alt={item.product?.title || 'Unknown Product'}
          className="w-full h-full object-cover rounded-xl"
          onError={setFallbackImage}
        />
      </div>
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                {item.product?.title || 'Product removed'}
              </h3>
              {isItemUnavailable && (
                <span className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-600/10 mb-2">
                  Currently Unavailable
                </span>
              )}
            </div>
            <button
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              onClick={() => onRemove(item.product?._id || item._id)}
              title="Remove item"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4 flex items-center">
            {getCampusPickupLabel(item.product?.location)}
          </p>
        </div>

        <div className="flex items-center justify-end mt-4">
          <div className="text-right">
            <p className={`text-xl font-bold ${isItemUnavailable ? 'text-gray-500 line-through' : 'text-black'}`}>
              {formatPrice(item.subtotal)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
