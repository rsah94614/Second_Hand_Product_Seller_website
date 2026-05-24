import React from 'react';
import ProductCard from '../../../components/ProductCard';

export const RelatedProductsSection = ({ products }) => {
  if (products.length === 0) return null;

  return (
    <section className="mt-12 mb-8">
      <h2 className="mb-6 text-xl font-bold text-gray-900 tracking-wide">You Might Also Like</h2>
      <div className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ scrollbarWidth: 'none' }}>
        {products.map((relatedProduct) => (
          <div key={relatedProduct._id} className="min-w-[240px] w-[240px] sm:min-w-[260px] sm:w-[260px] shrink-0">
            <ProductCard product={relatedProduct} />
          </div>
        ))}
      </div>
    </section>
  );
};
