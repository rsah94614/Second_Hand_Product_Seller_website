import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import ProductCard from '../../../components/ProductCard.jsx';
import {
  TrendingUp, Star, Users, Package, Sparkles, ArrowRight,
  ShieldCheck, Zap, BookOpen, Cpu, Coffee, Shirt, Music, Camera, Bike, Home,
} from 'lucide-react';
import Header from '../../../components/Header.jsx';
import Footer from '../../../components/Footer.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { API_BASE_URL } from '../../../config/api.js';
import { DEFAULT_PRODUCT_CATEGORIES } from '../../../config/productOptions.js';
import { getProductCategories } from '../../products/api/productApi.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { getRecentlyViewed } from '../../users/api/userApi.js';

const fetchProducts = (params) =>
  axios.get(`${API_BASE_URL}/api/products`, { params }).then((res) => res.data);

// Category icon & color mapping
const CATEGORY_META = {
  'Electronics': { icon: Cpu, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', text: 'text-blue-600' },
  'Books': { icon: BookOpen, color: 'from-amber-500 to-orange-500', bg: 'bg-amber-50', text: 'text-amber-600' },
  'Clothing': { icon: Shirt, color: 'from-pink-500 to-rose-500', bg: 'bg-pink-50', text: 'text-pink-600' },
  'Music': { icon: Music, color: 'from-violet-500 to-purple-600', bg: 'bg-violet-50', text: 'text-violet-600' },
  'Photography': { icon: Camera, color: 'from-cyan-500 to-sky-600', bg: 'bg-cyan-50', text: 'text-cyan-600' },
  'Sports': { icon: Bike, color: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', text: 'text-emerald-600' },
  'Food': { icon: Coffee, color: 'from-yellow-500 to-amber-500', bg: 'bg-yellow-50', text: 'text-yellow-600' },
  'Home': { icon: Home, color: 'from-stone-500 to-gray-600', bg: 'bg-stone-50', text: 'text-stone-600' },
  'Other': { icon: Package, color: 'from-primary-500 to-indigo-500', bg: 'bg-primary-50', text: 'text-primary-600' },
};
const getCategoryMeta = (name) =>
  CATEGORY_META[name] || { icon: Package, color: 'from-primary-500 to-indigo-600', bg: 'bg-primary-50', text: 'text-primary-600' };

const SectionShell = ({ title, description, icon, accent = 'text-primary-600', viewAllTo = '/products', children }) => (
  <section className="px-4 py-14 lg:px-12">
    <div className="mx-auto max-w-7xl">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <div className={`mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-widest ${accent} bg-current/5`}
            style={{ backgroundColor: 'transparent' }}
          >
            {React.createElement(icon, { className: `h-4 w-4 ${accent}` })}
            <span className={accent}>{title}</span>
          </div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900">{title}</h2>
          <p className="mt-2 max-w-xl text-gray-500 text-sm leading-relaxed">{description}</p>
        </div>
        <Link to={viewAllTo} className="hidden md:inline-flex shrink-0">
          <Button variant="outline" className="gap-2 rounded-full border-gray-200 px-5 hover:border-primary-300">
            View All
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
      {children}
      <div className="mt-14 h-px w-full bg-linear-to-r from-transparent via-gray-200 to-transparent" />
    </div>
  </section>
);

const SkeletonGrid = () => (
  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
    {[...Array(8)].map((_, i) => (
      <div key={i} className="overflow-hidden rounded-[1.75rem] bg-white shadow-sm animate-pulse">
        <div className="aspect-4/3 bg-gray-100" />
        <div className="space-y-3 p-5">
          <div className="h-4 rounded-full bg-gray-100 w-1/3" />
          <div className="h-5 rounded-full bg-gray-100" />
          <div className="h-7 rounded-full bg-gray-100 w-2/3" />
        </div>
      </div>
    ))}
  </div>
);

const HomePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: categoryResponse } = useQuery({
    queryKey: ['home-product-categories'],
    queryFn: getProductCategories,
    staleTime: 5 * 60 * 1000,
  });

  const categories = useMemo(
    () => categoryResponse?.categories?.map((c) => c.name).slice(0, 10) || DEFAULT_PRODUCT_CATEGORIES.slice(0, 10),
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

  const handleCategoryClick = (category) => {
    navigate(`/products?category=${encodeURIComponent(category)}`);
  };

  const renderTaggedProductGrid = (products, isLoading, highlightLabel, highlightTone) =>
    isLoading ? (
      <SkeletonGrid />
    ) : (
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
    );

  const recentlyViewed = (recentlyViewedResponse?.products || []).slice(0, 4);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f4ec_0%,#f8fafc_28%,#f8fafc_100%)]">
      <Header />

      {/* ── HERO ── */}
      <section className="relative overflow-hidden px-4 pb-10 pt-8 lg:px-12">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-4xl bg-slate-900 shadow-[0_30px_90px_-15px_rgba(15,23,42,0.28)] relative">
          {/* Gradient base */}
          <div className="absolute inset-0 bg-linear-to-br from-primary-950 via-indigo-900 to-blue-950 opacity-95" />
          {/* Ambient glow orbs */}
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[180%] rounded-full bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-primary-500/25 via-transparent to-transparent blur-3xl" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[160%] rounded-full bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-cyan-400/20 via-transparent to-transparent blur-3xl" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIuNSIgZmlsbD0iI2ZmZmZmZiIgZmlsbC1vcGFjaXR5PSIwLjA0Ii8+PC9zdmc+')] opacity-60" />

          <div className="relative z-10 grid gap-10 px-8 py-16 md:px-14 lg:grid-cols-[1.3fr_0.7fr] lg:py-20">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white/80 backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_6px_rgba(34,211,238,0.8)]" />
                CampusMitra — Marketplace 2025
              </div>
              <h1 className="max-w-2xl text-4xl font-black leading-none tracking-[-0.04em] text-white sm:text-5xl md:text-[3.5rem] animate-fade-in">
                Discover the most wanted finds around campus.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-white/65 md:text-lg">
                Search smarter, browse curated categories, and jump into premium, trending, and top-rated listings — without digging through clutter.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/products">
                  <Button variant="outline" className="h-12 px-7 rounded-full border-white/25 hover:text-primary-700 text-white bg-white/10">
                    Browse All Products <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/products?sortBy=views&sortOrder=desc">
                  <Button variant="outline" className="h-12 px-7 rounded-full border-white/25 hover:text-primary-700 text-white bg-white/10">
                    <TrendingUp className="mr-2 h-4 w-4" /> Trending
                  </Button>
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-3 text-sm text-white/50">
                {['Trending right now', 'Top rated picks', 'Recently viewed'].map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5">{tag}</span>
                ))}
              </div>
            </div>

            <div className="hidden lg:flex flex-col justify-center gap-8">
              {[
                { icon: Zap, color: 'text-amber-300', label: 'Curated for intent', sub: 'Fresh, trending & top-rated sections surface exact what buyers want.' },
                { icon: ShieldCheck, color: 'text-emerald-300', label: 'Ratings & trust signals', sub: 'Buyer ratings and history guide smarter purchasing decisions.' },
              ].map(({ icon: Icon, color, label, sub }) => (
                <div key={label} className="flex gap-4">
                  <div className={`mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ${color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-lg tracking-tight">{label}</h3>
                    <p className="mt-1 text-sm text-white/55 leading-relaxed">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="px-4 py-10 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Curated Browse</p>
              <h2 className="text-3xl font-black tracking-tight text-gray-900">Browse by Category</h2>
            </div>
            <Link to="/products" className="hidden md:block">
              <Button variant="outline" className="gap-2 rounded-full text-sm">
                All Products <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {categories.map((category) => {
              const { icon: CatIcon, color, bg, text } = getCategoryMeta(category);
              return (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className="group rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-gray-200"
                >
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-linear-to-br ${color} shadow-md transition-transform group-hover:scale-110`}>
                    <CatIcon className="h-6 w-6 text-white" />
                  </div>
                  <span className="block font-black text-gray-900 tracking-tight text-sm group-hover:text-primary-700 transition-colors">
                    {category}
                  </span>
                  <span className={`mt-1 block text-xs font-medium ${text} opacity-70`}>
                    Browse listings →
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-12 h-px w-full bg-linear-to-r from-transparent via-gray-200 to-transparent" />
        </div>
      </section>

      {/* ── PRODUCT SECTIONS ── */}
      <SectionShell
        title="Latest Products"
        description="Fresh listings from across the marketplace — spot newly available deals right away."
        icon={Sparkles}
        accent="text-primary-600"
      >
        {renderTaggedProductGrid(latestProducts, latestLoading, 'Fresh', 'bg-primary-600 text-white')}
      </SectionShell>

      <SectionShell
        title="Trending Right Now"
        description="Popular listings ranked by marketplace attention — jump into what others are viewing most."
        icon={TrendingUp}
        accent="text-amber-600"
        viewAllTo="/products?sortBy=views&sortOrder=desc"
      >
        {renderTaggedProductGrid(trendingProducts, trendingLoading, 'Trending', 'bg-amber-500 text-white')}
      </SectionShell>

      <SectionShell
        title="Top Rated Picks"
        description="Products with stronger buyer feedback — surfaced to build trust and speed up decisions."
        icon={Star}
        accent="text-rose-500"
        viewAllTo="/products?sortBy=averageRating&sortOrder=desc"
      >
        {renderTaggedProductGrid(topRatedProducts, ratedLoading, 'Top Rated', 'bg-rose-500 text-white')}
      </SectionShell>

      {user && recentlyViewed.length > 0 && (
        <SectionShell
          title="Pick Up Where You Left Off"
          description="Quick access to products you explored recently — continue comparing and buying."
          icon={Package}
          accent="text-violet-600"
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

      {/* ── STATS BAND ── */}
      <section className="px-4 pb-20 pt-4 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-4xl bg-slate-900 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)]">
            <div className="absolute inset-0 bg-linear-to-br from-indigo-900 via-primary-900 to-blue-950 opacity-95" />
            <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-cyan-400/15 via-transparent to-transparent blur-3xl" />
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/10">
              {[
                { icon: Users, value: '100+', label: 'Active Students', color: 'text-cyan-300' },
                { icon: Package, value: '50+', label: 'Products Listed', color: 'text-amber-300' },
                { icon: Star, value: '4.8/5', label: 'Average Rating', color: 'text-rose-300' },
              ].map(({ icon: Icon, value, label, color }) => (
                <div key={label} className="flex flex-col items-center justify-center gap-3 py-12 px-8 text-center">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 ${color}`}>
                    <Icon className="h-7 w-7" />
                  </div>
                  <p className={`text-5xl font-black tracking-tight ${color}`}>{value}</p>
                  <p className="text-sm font-semibold text-white/60 uppercase tracking-widest">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
