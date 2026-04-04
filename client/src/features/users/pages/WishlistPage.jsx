import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import ProductCard from '../../../components/ProductCard';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { getWishlist } from '../api/userApi';

const WishlistPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: getWishlist,
  });

  const products = data?.products || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <Card className="mb-8 rounded-3xl border-gray-100 shadow-sm animate-fade-in">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-3xl text-gray-900">
              <Heart className="h-8 w-8 text-rose-500" />
              Saved Items
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <p className="text-gray-600">
              Keep track of the products you want to revisit, compare, or buy later.
            </p>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="space-y-3 p-5">
                  <div className="h-5 rounded bg-gray-200" />
                  <div className="h-6 w-2/3 rounded bg-gray-200" />
                  <div className="h-4 w-1/2 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <Card className="rounded-3xl border-gray-100 shadow-sm text-center animate-fade-in">
            <CardContent className="p-12">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-rose-50 text-rose-400">
                <Heart className="h-12 w-12" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">No saved items yet</h2>
              <p className="mx-auto mt-3 max-w-md text-gray-600">
                Tap the heart on products you like, and they&apos;ll appear here for quick access.
              </p>
              <Link to="/products" className="mt-6 inline-flex">
                <Button>Browse Products</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 animate-fade-in">
            {products.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default WishlistPage;
