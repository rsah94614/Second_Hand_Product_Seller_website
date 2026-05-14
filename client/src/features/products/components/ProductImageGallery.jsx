import React from 'react';
import { Badge } from '../../../components/ui/Badge';
import { PRODUCT_FALLBACK_IMAGE, setFallbackImage } from '../../../lib/fallbackImages';

export const ProductImageGallery = ({ product, currentIndex, onIndexChange }) => {
  return (
    <div className="space-y-6">
      <div className="relative w-full overflow-hidden rounded-[2.5rem] bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.08)] border border-gray-100 group" style={{aspectRatio:'1/1'}}>
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none" />
        <img
          src={product.images[currentIndex] || PRODUCT_FALLBACK_IMAGE}
          alt={product.title}
          className="w-full h-full object-contain p-6 transition-transform duration-700 group-hover:scale-105"
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
              className={`shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
                currentIndex === index
                  ? 'border-primary-600 ring-4 ring-primary-600/20 scale-105 shadow-lg'
                  : 'border-transparent hover:border-primary-300 opacity-70 hover:opacity-100 bg-white shadow-sm'
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
