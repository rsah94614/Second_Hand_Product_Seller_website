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
      <div className="card bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
        <div className="relative overflow-hidden">
          <img
            src={product.images[0] || '/placeholder-image.jpg'}
            alt={product.title}
            className="w-full h-40 object-contain group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x200?text=No+Image';
            }}
          />
          {product.isSold && (
            <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-sm font-semibold">
              SOLD
            </div>
          )}
        </div>
        
        <div className="p-4">
          <h3 className="font-semibold text-lg text-gray-800 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {product.title}
          </h3>
          
          <p className="text-2xl font-bold text-green-600 mb-2">
            {formatPrice(product.price)}
          </p>
          
          <div className="flex items-center text-gray-600 text-sm mb-2">
            <MapPin className="w-4 h-4 mr-1 shrink-0" />
            <span className="truncate">{product.location}</span>
          </div>
          
          <div className="flex items-center justify-between text-gray-500 text-sm">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              <span>{formatDate(product.createdAt)}</span>
            </div>
            <div className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              <span>{product.views || 0}</span>
            </div>
          </div>
          
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
              {product.category}
            </span>
            <span className="inline-block bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-medium">
              {product.condition}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
