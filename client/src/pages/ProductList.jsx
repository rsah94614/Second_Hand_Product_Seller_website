import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import ProductCard from '../components/ProductCard';
import { Search, Filter, SortAsc, SortDesc, MapPin } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Input } from '../components/ui/Input';

const ProductList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    location: searchParams.get('location') || '',
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: searchParams.get('sortOrder') || 'desc',
    page: parseInt(searchParams.get('page')) || 1,
  });
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    'Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books',
    'Vehicles', 'Tools', 'FreeZone', 'Furniture', 'Other'
  ];

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const res = await axios.get(import.meta.env.VITE_BACKEND_URL + `/api/products?${params.toString()}`);
      return res.data;
    },
    keepPreviousData: true,
  });


  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value, page: 1 };
    setFilters(newFilters);

    const newSearchParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) newSearchParams.set(k, v);
    });
    setSearchParams(newSearchParams);
  };

  const handlePageChange = (newPage) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);

    const newSearchParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) newSearchParams.set(k, v);
    });
    setSearchParams(newSearchParams);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      location: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
    });
    setSearchParams({});
  };

  const Pagination = () => {
    if (!data || data.totalPages <= 1) return null;

    const pages = [];
    const totalPages = data.totalPages;
    const currentPage = data.currentPage;

    // Show first page
    if (currentPage > 3) {
      pages.push(1);
      if (currentPage > 4) pages.push('...');
    }

    // Show pages around current page
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
      pages.push(i);
    }

    // Show last page
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) pages.push('...');
      pages.push(totalPages);
    }

    return (
      <div className="flex justify-center items-center space-x-2 mt-8">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          Previous
        </button>

        {pages.map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === 'number' && handlePageChange(page)}
            disabled={page === '...'}
            className={`px-3 py-2 border rounded transition-colors ${page === currentPage
              ? 'bg-primary-600 text-white border-primary-600'
              : 'border-gray-300 hover:bg-gray-50'
              } ${page === '...' ? 'cursor-default' : ''}`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="py-8 px-4 w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold font-display">Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  Clear All
                </button>
              </div>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Search products..."
                    className="pl-9"
                  />
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </div>

              {/* Category */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range
                </label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    placeholder="Min"
                    className="w-full"
                  />
                  <Input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    placeholder="Max"
                    className="w-full"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    placeholder="Enter location..."
                    className="pl-9"
                  />
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
              </div>

              {/* Sort */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    const newFilters = { ...filters, sortBy, sortOrder, page: 1 };
                    setFilters(newFilters);

                    const newSearchParams = new URLSearchParams();
                    Object.entries(newFilters).forEach(([k, v]) => {
                      if (v) newSearchParams.set(k, v);
                    });
                    setSearchParams(newSearchParams);
                  }}
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="w-full max-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                {data?.total ? `${data.total} Products Found` : 'Products'}
              </h2>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="card animate-pulse">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 text-lg">Error loading products. Please try again.</p>
              </div>
            ) : data?.products?.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 text-lg">No products found. Try adjusting your filters.</p>
                <Link
                  to="/create-product"
                  className="inline-block mt-4 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  List Your Product
                </Link>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {data?.products?.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
                <Pagination />
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProductList;
