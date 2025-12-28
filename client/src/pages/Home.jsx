import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query'
import axios from 'axios';
import ProductCard from '../components/ProductCard.jsx';
import { Search, TrendingUp, Star, Users, Package } from 'lucide-react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const categories = [
    'Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books',
    'Vehicles', 'Tools', 'FreeZone', 'Furniture', 'Other'
  ];

  const { data: featuredProducts, isLoading } = useQuery({
    queryKey: ['products', { limit: 8, sortBy: 'createdAt', sortOrder: 'desc' }],
    queryFn: async () => {
      const res = await axios.get(import.meta.env.VITE_BACKEND_URL + '/api/products', {
        params: { limit: 8, sortBy: 'createdAt', sortOrder: 'desc' },
      });
      return res.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });


  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const handleCategoryClick = (category) => {
    window.location.href = `/products?category=${encodeURIComponent(category)}`;
  };

  return (
    <div className="min-h-screen">
      <Header />
      {/* Hero Section */}
      <section className="flex justify-center items-center bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
        <div className="container px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold mb-6 animate-fade-in font-display">
              Buy & Sell Anything
            </h1>
            <p className="text-xl mb-8 opacity-90 animate-slide-up">
              Find great deals on everything you need, or sell your unused items to make some extra cash.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-6 py-4 pl-12 pr-4 text-gray-900 rounded-lg text-lg focus:outline-none focus:ring-4 focus:ring-white/20 shadow-lg bg-white placeholder:text-gray-500"
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
              </div>
            </form>
          </div>
        </div>
      </section>
      <div className="flex flex-col justify-center items-center">

        {/* Categories Section */}
        <section className="flex justify-center items-center py-16 w-full lg:px-20 bg-white">
          <div className="container px-4">
            <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 font-display">
              Browse by Category
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryClick(category)}
                  className="p-6 bg-gray-50 rounded-xl hover:bg-primary-50 hover:ring-2 hover:ring-primary-200 transition-all duration-300 group hover:shadow-md"
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:scale-110 transition-transform">
                      <Package className="w-6 h-6 text-primary-600" />
                    </div>
                    <span className="font-semibold text-gray-700 group-hover:text-primary-700 transition-colors">
                      {category}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Products Section */}
        <section className="flex items-center justify-center py-16 w-full lg:px-20 bg-gray-100">
          <div className="container px-4">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-3xl font-bold text-gray-800">
                Latest Products
              </h2>
              <Link
                to="/products"
                className="flex items-center text-blue-600 hover:text-blue-700 font-semibold transition-colors"
              >
                View All
                <TrendingUp className="w-4 h-4 ml-2" />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="card bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl animate-pulse">
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-4">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            )
              : (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                  {featuredProducts?.products?.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>
              )}
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 text-black justify-between">
          <div className="container w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 md:gap-30 lg:gap-50 text-center">
              <div className="animate-fade-in">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold mb-2">100+</h3>
                <p className="text-black">Active Users</p>
              </div>
              <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold mb-2">50+</h3>
                <p className="text-black">Products Listed</p>
              </div>
              <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8" />
                </div>
                <h3 className="text-3xl font-bold mb-2">4.8/5</h3>
                <p className="text-black">User Rating</p>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
};

export default Home;
