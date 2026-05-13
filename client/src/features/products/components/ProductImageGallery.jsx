import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { PRODUCT_FALLBACK_IMAGE, setFallbackImage } from '../../../lib/fallbackImages';

export const ProductImageGallery = ({ product, currentIndex, onIndexChange }) => {
  return (
    <div className="space-y-5">
      <div className="relative w-full overflow-hidden rounded-4xl bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-gray-100" style={{aspectRatio:'1/1'}}>
        <img
          src={product.images[currentIndex] || PRODUCT_FALLBACK_IMAGE}
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
              onClick={() => onIndexChange(index)}
              className={`shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 transition-all ${
                currentIndex === index
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
  );
};
