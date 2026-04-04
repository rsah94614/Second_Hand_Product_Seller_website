import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import ProductCard from '../../../components/ProductCard.jsx';
import { Search, TrendingUp, Star, Users, Package, Sparkles, ArrowRight, Compass, ShieldCheck } from 'lucide-react';
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
  <section className="px-4 py-16 lg:px-12">
    <div className="mx-auto max-w-7xl">
      <div className="mb-10 flex items-center justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-semibold text-primary-700">
            {React.createElement(icon, { className: 'h-4 w-4' })}
            <span>{title}</span>
          </div>
          <h2 className="text-3xl font-black tracking-[-0.03em] text-stone-950">{title}</h2>
          <p className="mt-2 max-w-2xl text-stone-600">{description}</p>
        </div>
        <Link to={viewAllTo} className="hidden md:inline-flex">
          <Button variant="outline" className="gap-2 rounded-full border-stone-200 px-5">
            View All
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      {children}
      <div className="mt-14 h-px w-full bg-linear-to-r from-transparent via-stone-300 to-transparent" />
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
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm animate-pulse">
            <div className="aspect-4/3 bg-gray-200" />
            <div className="space-y-3 p-5">
              <div className="h-5 rounded bg-gray-200" />
              <div className="h-6 w-2/3 rounded bg-gray-200" />
              <div className="h-4 w-1/2 rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 animate-fade-in">
        {(products?.products || []).map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    )
  );

const renderTaggedProductGrid = (products, isLoading, highlightLabel, highlightTone) => (
    isLoading ? renderProductGrid(products, isLoading) : (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 animate-fade-in">
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
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f4ec_0%,#f8fafc_28%,#f8fafc_100%)]">
      <Header />

      <section className="relative overflow-hidden px-4 pb-10 pt-8 lg:px-12">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#111827_0%,#172554_38%,#0f766e_100%)] text-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]">
          <div className="absolute inset-0 opacity-25">
            <div className="absolute left-10 top-10 h-40 w-40 rounded-full bg-white/20 blur-3xl" />
            <div className="absolute bottom-0 right-0 h-56 w-56 rounded-full bg-amber-300/30 blur-3xl" />
          </div>
          <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.16),transparent_62%)] lg:block" />
          <div className="relative grid gap-10 px-6 py-14 md:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:px-14 lg:py-16">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
                <Sparkles className="h-4 w-4" />
                Marketplace editorial edition
              </div>
              <h1 className="max-w-3xl text-4xl font-black leading-[0.95] tracking-[-0.05em] text-white md:text-6xl animate-fade-in">
                Discover the most wanted finds around campus.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/75 md:text-lg animate-fade-up-delayed">
                Search smarter, browse curated categories, and jump into premium, trending, and top-rated listings without digging through clutter.
              </p>

              <form onSubmit={handleSearch} className="mt-8 max-w-3xl">
                <div className="relative rounded-2xl border border-white/15 bg-white/95 p-2 shadow-2xl">
                  <Input
                    type="text"
                    placeholder="Search products, categories, or locations"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="h-14 rounded-xl border-0 bg-transparent pl-12 pr-36 text-base text-gray-900 shadow-none focus-visible:ring-0"
                  />
                  <Search className="absolute left-6 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <Button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-stone-950 px-5 text-white hover:bg-stone-800">
                    Search
                  </Button>
                </div>
              </form>

              <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/75">
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Trending right now</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Top rated picks</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2">Recently viewed</span>
              </div>
            </div>

            <div className="grid gap-4 self-end md:grid-cols-2 lg:grid-cols-1">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-md">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-amber-300">
                  <Compass className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-white/55">Discovery</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em]">Curated for intent</h2>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  Fresh, trending, and top-rated sections make the homepage feel like a real marketplace front page.
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/10 p-6 backdrop-blur-md">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-emerald-300">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <p className="text-sm font-bold uppercase tracking-[0.22em] text-white/55">Trust</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em]">Ratings and signals</h2>
                <p className="mt-3 text-sm leading-6 text-white/70">
                  Ratings, popularity, and product history guide better decisions without overwhelming the buyer.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-6 lg:px-12">
        <div className="mx-auto max-w-7xl px-2 py-4 md:px-0">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-stone-400">Curated Browse</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-stone-950 font-display">
                Browse by Category
              </h2>
            </div>
            <p className="hidden max-w-xl text-sm leading-6 text-stone-500 md:block">
              Jump straight into the categories your users care about most without sending them through generic navigation.
            </p>
          </div>
          <h2 className="sr-only">
            Browse by Category
          </h2>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryClick(category)}
                className="group rounded-2xl border border-stone-200 bg-[linear-gradient(180deg,#ffffff_0%,#faf7ef_100%)] p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:border-primary-200 hover:bg-white hover:shadow-xl"
              >
                <div>
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-stone-100 text-primary-600 shadow-sm transition-transform group-hover:scale-110 group-hover:bg-primary-50">
                    <Package className="h-6 w-6 text-primary-600" />
                  </div>
                  <span className="block font-black tracking-[-0.02em] text-stone-900 transition-colors group-hover:text-primary-700">
                    {category}
                  </span>
                  <span className="mt-2 block text-sm text-stone-500">
                    Explore curated listings
                  </span>
                </div>
              </button>
            ))}
          </div>
          <div className="mt-14 h-px w-full bg-linear-to-r from-transparent via-stone-300 to-transparent" />
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 animate-fade-in">
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

      <section className="px-4 pb-16 pt-6 text-black lg:px-12">
        <div className="mx-auto w-full max-w-7xl px-2 py-4 sm:px-0">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-stone-400">Marketplace Snapshot</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-stone-950">A more confident storefront</h2>
            </div>
            <p className="max-w-2xl text-sm leading-6 text-stone-500">
              These summary blocks reinforce activity, trust, and quality so the landing page feels active even before a user scrolls deeper.
            </p>
          </div>
          <div className="grid grid-cols-1 text-center md:grid-cols-3 md:gap-6 lg:gap-8">
            <Card className="border-stone-200/70 bg-white/70 shadow-none backdrop-blur-sm animate-fade-in">
              <CardContent className="p-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl border border-primary-100 bg-primary-50/70">
                  <Users className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="mb-2 text-3xl font-black tracking-[-0.03em]">100+</h3>
                <p className="text-stone-600">Active Users</p>
              </CardContent>
            </Card>
            <Card className="border-stone-200/70 bg-white/70 shadow-none backdrop-blur-sm animate-fade-in">
              <CardContent className="p-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl border border-amber-100 bg-amber-50/70">
                  <Package className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="mb-2 text-3xl font-black tracking-[-0.03em]">50+</h3>
                <p className="text-stone-600">Products Listed</p>
              </CardContent>
            </Card>
            <Card className="border-stone-200/70 bg-white/70 shadow-none backdrop-blur-sm animate-fade-in">
              <CardContent className="p-8">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl border border-rose-100 bg-rose-50/70">
                  <Star className="h-8 w-8 text-rose-500" />
                </div>
                <h3 className="mb-2 text-3xl font-black tracking-[-0.03em]">4.8/5</h3>
                <p className="text-stone-600">User Rating</p>
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
