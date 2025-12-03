import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Eye, Calendar } from 'lucide-react';

const ProductCard = ({ product }) => {
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
            <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
              SOLD
            </div>
          )}
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
