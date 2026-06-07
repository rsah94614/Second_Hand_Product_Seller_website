import React from 'react';
import ProductCard from '../../../components/ProductCard';

export const RelatedProductsSection = ({ products }) => {
  if (products.length === 0) return null;

  return (
    <section className="mt-12 mb-8">
      <h2 className="mb-6 text-xl font-bold text-gray-900 tracking-wide">You Might Also Like</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {products.map((relatedProduct) => (
          <div key={relatedProduct._id} className="min-w-0">
            <ProductCard product={relatedProduct} />
          </div>
        ))}
      </div>
    </section>
  );
};
