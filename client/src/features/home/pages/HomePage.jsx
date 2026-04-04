import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import ProductCard from '../../../components/ProductCard.jsx';
import { Search, TrendingUp, Star, Users, Package, Sparkles, ArrowRight } from 'lucide-react';
import Header from '../../../components/Header.jsx';
import Footer from '../../../components/Footer.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Card, CardContent } from '../../../components/ui/Card.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { API_BASE_URL } from '../../../config/api.js';
import { DEFAULT_PRODUCT_CATEGORIES } from '../../../config/productOptions.js';
import { getProductCategories } from '../../products/api/productApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { getRecentlyViewed } from '../../users/api/userApi.js';

const fetchProducts = (params) =>
  axios.get(`${API_BASE_URL}/api/products`, { params }).then((res) => res.data);

const SectionShell = ({ title, description, icon, viewAllTo = '/products', children }) => (
  <section className="flex items-center justify-center py-16 w-full lg:px-20 bg-gray-100">
    <div className="container px-4">
      <div className="mb-10 flex items-center justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary-700 shadow-sm">
            {React.createElement(icon, { className: 'h-4 w-4' })}
            <span>{title}</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">{title}</h2>
          <p className="mt-2 max-w-2xl text-gray-600">{description}</p>
        </div>
        <Link to={viewAllTo} className="hidden md:inline-flex">
          <Button variant="outline" className="gap-2">
            View All
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      {children}
    </div>
  </section>
);

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: categoryResponse } = useQuery({
    queryKey: ['home-product-categories'],
    queryFn: getProductCategories,
    staleTime: 5 * 60 * 1000,
  });

  const categories = useMemo(
    () => categoryResponse?.categories?.map((category) => category.name).slice(0, 10) || DEFAULT_PRODUCT_CATEGORIES.slice(0, 10),
    [categoryResponse]
  );

  const { data: latestProducts, isLoading: latestLoading } = useQuery({
    queryKey: ['home-products-latest'],
    queryFn: () => fetchProducts({ limit: 8, sortBy: 'createdAt', sortOrder: 'desc' }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: trendingProducts, isLoading: trendingLoading } = useQuery({
    queryKey: ['home-products-trending'],
    queryFn: () => fetchProducts({ limit: 8, sortBy: 'views', sortOrder: 'desc' }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: topRatedProducts, isLoading: ratedLoading } = useQuery({
    queryKey: ['home-products-top-rated'],
    queryFn: () => fetchProducts({ limit: 8, sortBy: 'averageRating', sortOrder: 'desc' }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: recentlyViewedResponse } = useQuery({
    queryKey: ['home-recently-viewed'],
    queryFn: getRecentlyViewed,
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const handleSearch = (event) => {
    event.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleCategoryClick = (category) => {
    navigate(`/products?category=${encodeURIComponent(category)}`);
  };

  const renderProductGrid = (products, isLoading) => (
    isLoading ? (
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
    ) : (
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 animate-fade-in">
        {(products?.products || []).map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    )
  );

  const renderTaggedProductGrid = (products, isLoading, highlightLabel, highlightTone) => (
    isLoading ? renderProductGrid(products, isLoading) : (
      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 animate-fade-in">
        {(products?.products || []).map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            highlightLabel={highlightLabel}
            highlightTone={highlightTone}
          />
        ))}
      </div>
    )
  );

  const recentlyViewed = (recentlyViewedResponse?.products || []).slice(0, 4);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <section className="relative overflow-hidden bg-linear-to-r from-primary-700 via-primary-600 to-primary-800 py-24 text-white">
        <div className="absolute inset-0 opacity-25">
          <div className="absolute left-10 top-10 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-accent-300/30 blur-3xl" />
        </div>
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
              <Sparkles className="h-4 w-4" />
              Smarter marketplace discovery
            </div>
            <h1 className="mb-6 text-5xl font-bold font-display animate-fade-in">
              Find better products faster
            </h1>
            <p className="mb-10 text-xl opacity-90 animate-fade-up-delayed">
              Search by what matters, explore trending listings, and discover top-rated products curated for active campus shoppers.
            </p>

            <form onSubmit={handleSearch} className="mx-auto max-w-3xl">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search products, categories, or locations"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="h-14 rounded-2xl border-white/20 bg-white pl-14 pr-36 text-lg text-gray-900 shadow-2xl"
                />
                <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl px-5">
                  Search
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="flex items-center justify-center bg-white py-16 w-full lg:px-20">
        <div className="container px-4">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900 font-display">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                className="group rounded-2xl bg-gray-50 p-6 transition-all duration-300 hover:bg-primary-50 hover:ring-2 hover:ring-primary-200 hover:shadow-md"
              >
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm transition-transform group-hover:scale-110">
                    <Package className="h-6 w-6 text-primary-600" />
                  </div>
                  <span className="font-semibold text-gray-700 transition-colors group-hover:text-primary-700">
                    {category}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <SectionShell
        title="Latest Products"
        description="Fresh listings from across the marketplace so users can spot newly available deals right away."
        icon={Sparkles}
      >
        {renderTaggedProductGrid(latestProducts, latestLoading, 'Fresh', 'bg-primary-600 text-white')}
      </SectionShell>

      <SectionShell
        title="Trending Right Now"
        description="Popular listings ranked by marketplace attention, helping users jump into what others are viewing most."
        icon={TrendingUp}
        viewAllTo="/products?sortBy=views&sortOrder=desc"
      >
        {renderTaggedProductGrid(trendingProducts, trendingLoading, 'Trending', 'bg-amber-500 text-white')}
      </SectionShell>

      <SectionShell
        title="Top Rated Picks"
        description="Products with stronger buyer feedback and ratings, surfaced to build trust and speed up decision-making."
        icon={Star}
        viewAllTo="/products?sortBy=averageRating&sortOrder=desc"
      >
        {renderTaggedProductGrid(topRatedProducts, ratedLoading, 'Top Rated', 'bg-rose-500 text-white')}
      </SectionShell>

      {user && recentlyViewed.length > 0 && (
        <SectionShell
          title="Pick Up Where You Left Off"
          description="Quick access to products you explored recently, so returning users can continue comparing and buying."
          icon={Package}
          viewAllTo="/products"
        >
          <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 animate-fade-in">
            {recentlyViewed.map((product) => (
              <ProductCard
                key={`home-recent-${product._id}`}
                product={product}
                highlightLabel="Viewed"
                highlightTone="bg-violet-500 text-white"
              />
            ))}
          </div>
        </SectionShell>
      )}

      <section className="py-16 text-black">
        <div className="container mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 text-center md:grid-cols-3 md:gap-16 lg:gap-24">
            <Card className="border-gray-100 shadow-sm animate-fade-in">
              <CardContent className="p-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-50">
                  <Users className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="mb-2 text-3xl font-bold">100+</h3>
                <p className="text-gray-600">Active Users</p>
              </CardContent>
            </Card>
            <Card className="border-gray-100 shadow-sm animate-fade-in">
              <CardContent className="p-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-50">
                  <Package className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="mb-2 text-3xl font-bold">50+</h3>
                <p className="text-gray-600">Products Listed</p>
              </CardContent>
            </Card>
            <Card className="border-gray-100 shadow-sm animate-fade-in">
              <CardContent className="p-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50">
                  <Star className="h-8 w-8 text-rose-500" />
                </div>
                <h3 className="mb-2 text-3xl font-bold">4.8/5</h3>
                <p className="text-gray-600">User Rating</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
