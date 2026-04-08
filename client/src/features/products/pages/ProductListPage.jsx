import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { Search, Filter, MapPin, X, Package, ChevronDown, Loader2 } from 'lucide-react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import ProductCard from '../../../components/ProductCard';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/Select';
import { DEFAULT_PRODUCT_CATEGORIES } from '../../../config/productOptions';
import { getProductCategories } from '../api/productApi';
import { API_BASE_URL } from '../../../config/api';
import axios from 'axios';

const PAGE_SIZE = 8;

const fetchProducts = async ({ pageParam = null, filters }) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value && key !== 'page' && key !== 'cursor') params.append(key, value);
  });
  if (pageParam) params.set('cursor', pageParam);
  params.set('limit', PAGE_SIZE);
  const res = await axios.get(`${API_BASE_URL}/api/products?${params.toString()}`);
  return res.data;
};

const ProductListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    location: searchParams.get('location') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc',
  });

  const loaderRef = useRef(null);

  const { data: categoryResponse } = useQuery({
    queryKey: ['product-categories'],
    queryFn: getProductCategories,
  });

  const categories = useMemo(
    () => categoryResponse?.categories?.map((c) => c.name) || DEFAULT_PRODUCT_CATEGORIES,
    [categoryResponse]
  );

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error,
  } = useInfiniteQuery({
    queryKey: ['products-infinite', filters],
    queryFn: ({ pageParam = null }) => fetchProducts({ pageParam, filters }),
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    keepPreviousData: true,
  });

  // Intersection observer for infinite scroll
  const handleObserver = useCallback(
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage]
  );

  useEffect(() => {
    const element = loaderRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [handleObserver]);

  const updateFiltersAndUrl = (nextFilters) => {
    setFilters(nextFilters);
    const nextSearchParams = new URLSearchParams();
    Object.entries(nextFilters).forEach(([key, value]) => {
      if (value) nextSearchParams.set(key, value);
    });
    setSearchParams(nextSearchParams);
  };

  const handleFilterChange = (key, value) => {
    updateFiltersAndUrl({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    const cleared = {
      search: '', category: '', minPrice: '', maxPrice: '',
      location: '', sortBy: 'createdAt', sortOrder: 'desc',
    };
    setFilters(cleared);
    setSearchParams({});
    setShowFilterPanel(false);
  };

  const hasActiveFilters = filters.search || filters.category || filters.minPrice || filters.maxPrice || filters.location;
  const allProducts = data?.pages?.flatMap((p) => p.products) ?? [];
  const totalCount = data?.pages?.[0]?.total ?? 0;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f4ec_0%,#f8fafc_24%,#f8fafc_100%)]">
      <Header />

      {/* ── TOP FILTER BAR ── */}
      <div className="sticky top-16 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">

          {/* Search */}
          {/* <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Input
              type="text"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              placeholder="Search products..."
              className="pl-9 h-9 text-sm rounded-full"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div> */}

          {/* Category quick pills */}
          <div className="hidden md:flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => handleFilterChange('category', '')}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                !filters.category ? 'bg-primary-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            {categories.slice(0, 8).map((cat) => (
              <button
                key={cat}
                onClick={() => handleFilterChange('category', cat === filters.category ? '' : cat)}
                className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  filters.category === cat ? 'bg-primary-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* Sort */}
            <Select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split('-');
                updateFiltersAndUrl({ ...filters, sortBy, sortOrder });
              }}
            >
              <SelectTrigger className="h-9 rounded-full text-xs px-4 border-gray-200 w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt-desc">Newest First</SelectItem>
                <SelectItem value="createdAt-asc">Oldest First</SelectItem>
                <SelectItem value="price-asc">Price: Low → High</SelectItem>
                <SelectItem value="price-desc">Price: High → Low</SelectItem>
                <SelectItem value="views-desc">Most Popular</SelectItem>
                <SelectItem value="averageRating-desc">Top Rated</SelectItem>
              </SelectContent>
            </Select>

            {/* More Filters toggle */}
            <Button
              onClick={() => setShowFilterPanel((p) => !p)}
              variant="outline"
              size="sm"
              className={`gap-1.5 rounded-full px-4 text-xs ${showFilterPanel ? 'bg-primary-600 text-white border-primary-600' : ''}`}
            >
              <Filter className="w-3.5 h-3.5" />
              More
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilterPanel ? 'rotate-180' : ''}`} />
            </Button>

            {hasActiveFilters && (
              <Button
                onClick={clearFilters}
                variant="outline"
                size="sm"
                className="gap-1 rounded-full px-4 text-xs text-red-500 border-red-200 hover:bg-red-50"
              >
                <X className="w-3 h-3" /> Clear
              </Button>
            )}
          </div>
        </div>

        {/* Expanded filter panel */}
        {showFilterPanel && (
          <div className="border-t border-gray-100 bg-white/95 backdrop-blur-sm px-4 sm:px-6 py-4">
            <div className="max-w-[1600px] mx-auto flex flex-wrap gap-4">
              <div className="flex-1 min-w-[140px] max-w-xs">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Price Min (₹)</label>
                <Input type="number" value={filters.minPrice} onChange={(e) => handleFilterChange('minPrice', e.target.value)} placeholder="0" className="h-9 text-sm" />
              </div>
              <div className="flex-1 min-w-[140px] max-w-xs">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Price Max (₹)</label>
                <Input type="number" value={filters.maxPrice} onChange={(e) => handleFilterChange('maxPrice', e.target.value)} placeholder="Any" className="h-9 text-sm" />
              </div>
              <div className="flex-1 min-w-[180px] max-w-xs">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Location</label>
                <div className="relative">
                  <Input type="text" value={filters.location} onChange={(e) => handleFilterChange('location', e.target.value)} placeholder="Enter city..." className="pl-9 h-9 text-sm" />
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                </div>
              </div>
              {/* Mobile category select */}
              <div className="flex-1 min-w-[180px] max-w-xs md:hidden">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">Category</label>
                <Select value={filters.category || 'all'} onValueChange={(v) => handleFilterChange('category', v === 'all' ? '' : v)}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="All Categories" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">

        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900">
              {!isLoading && totalCount > 0 ? (
                <><span className="text-primary-600">{totalCount}</span> Products</>
              ) : 'All Products'}
            </h1>
            {/* Active filter chips */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mt-2">
                {filters.category && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 border border-primary-200 px-3 py-1 text-xs font-bold text-primary-700">
                    {filters.category}
                    <button onClick={() => handleFilterChange('category', '')}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {filters.search && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 border border-gray-200 px-3 py-1 text-xs font-bold text-gray-600">
                    "{filters.search}"
                    <button onClick={() => handleFilterChange('search', '')}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {(filters.minPrice || filters.maxPrice) && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-700">
                    ₹{filters.minPrice || 0}–{filters.maxPrice || '∞'}
                    <button onClick={() => { handleFilterChange('minPrice', ''); handleFilterChange('maxPrice', ''); }}><X className="h-3 w-3" /></button>
                  </span>
                )}
                {filters.location && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
                    📍 {filters.location}
                    <button onClick={() => handleFilterChange('location', '')}><X className="h-3 w-3" /></button>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="overflow-hidden rounded-[1.75rem] bg-white shadow-sm animate-pulse">
                <div className="aspect-4/3 bg-gray-100" />
                <div className="space-y-3 p-4">
                  <div className="h-3 rounded-full bg-gray-100 w-1/3" />
                  <div className="h-5 rounded-full bg-gray-100" />
                  <div className="h-7 rounded-full bg-gray-100 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-3xl bg-red-50 border border-red-100 p-12 text-center">
            <p className="text-red-600 font-semibold">Error loading products. Please try again.</p>
          </div>
        ) : allProducts.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-gray-200 bg-white/50 p-20 text-center">
            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-gray-50">
              <Package className="h-10 w-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-black text-gray-900">No products found</h3>
            <p className="mt-2 text-gray-500 text-sm max-w-sm mx-auto leading-relaxed">
              We couldn't find listings matching your filters. Try removing some filters.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Button variant="outline" onClick={clearFilters} className="rounded-full px-6">Clear Filters</Button>
              <Link to="/create-product"><Button variant="primary" className="rounded-full px-6">List an Item</Button></Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 animate-fade-in">
            {allProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}

        {/* Infinite scroll sentinel */}
        <div ref={loaderRef} className="flex justify-center py-10">
          {isFetchingNextPage && (
            <div className="flex items-center gap-3 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
              <span className="text-sm font-medium">Loading more products…</span>
            </div>
          )}
          {!hasNextPage && allProducts.length > 0 && (
            <p className="text-sm text-gray-400 font-medium">You've seen all {totalCount} products</p>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductListPage;
