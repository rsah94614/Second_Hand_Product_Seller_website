import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import ProductCard from '../../../components/ProductCard';

export const RelatedProductsSection = ({ products, category }) => {
  if (products.length === 0) return null;

  return (
    <section className="mt-16">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Similar Items</h2>
          <p className="mt-2 text-gray-600">
            Similar listings based on category, price range, popularity, and rating.
          </p>
        </div>
        <Link to={`/products?category=${encodeURIComponent(category)}`}>
          <Button variant="outline">Explore More</Button>
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 animate-fade-in">
        {products.slice(0, 4).map((relatedProduct) => (
          <ProductCard key={relatedProduct._id} product={relatedProduct} />
        ))}
      </div>
    </section>
  );
};
