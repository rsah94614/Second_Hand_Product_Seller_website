import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  Briefcase,
  Eye,
  Plus,
  Package,
  CheckCircle2,
  Clock3,
  ArrowRight,
} from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config/api';

const SellerDashboard = () => {
  const { user } = useAuth();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['user-dashboard-products', user?.id],
    queryFn: () =>
      axios
        .get(`${API_BASE_URL}/api/products/user/${user?.id}`)
        .then((res) => res.data),
    enabled: !!user?.id,
  });

  const metrics = products.reduce(
    (acc, product) => {
      acc.totalListings += 1;
      acc.totalViews += product.views || 0;

      if (product.isSold) {
        acc.soldListings += 1;
      } else if (product.isActive) {
        acc.activeListings += 1;
      } else {
        acc.inactiveListings += 1;
      }

      return acc;
    },
    {
      totalListings: 0,
      activeListings: 0,
      inactiveListings: 0,
      soldListings: 0,
      totalViews: 0,
    }
  );

  const recentProducts = [...products]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  const statCards = [
    {
      label: 'Total Listings',
      value: metrics.totalListings,
      icon: Briefcase,
      tone: 'bg-blue-50 text-blue-700 border-blue-100',
    },
    {
      label: 'Active Listings',
      value: metrics.activeListings,
      icon: Package,
      tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
    {
      label: 'Sold Listings',
      value: metrics.soldListings,
      icon: CheckCircle2,
      tone: 'bg-amber-50 text-amber-700 border-amber-100',
    },
    {
      label: 'Total Views',
      value: metrics.totalViews,
      icon: Eye,
      tone: 'bg-violet-50 text-violet-700 border-violet-100',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary-600">
                User Workspace
              </p>
              <h1 className="text-4xl font-bold text-gray-900 mt-2">
                Welcome back, {user?.name}
              </h1>
              <p className="text-gray-600 mt-3 max-w-2xl">
                Manage your listings, track interest, and keep your marketplace presence active.
                This is the base of your user dashboard and we&apos;ll keep growing it in the next milestones.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/create-product"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 text-white px-6 py-3 font-semibold shadow-sm hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </Link>
              <Link
                to="/my-products"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-gray-200 bg-white text-gray-700 px-6 py-3 font-semibold hover:bg-gray-50 transition-colors"
              >
                Manage Listings
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          {statCards.map((card) => {
            const StatIcon = card.icon;

            return (
              <div
                key={card.label}
                className={`rounded-2xl border p-6 shadow-sm ${card.tone}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{card.label}</span>
                  <StatIcon className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold mt-4">{card.value}</p>
              </div>
            );
          })}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Recent Listings</h2>
                <p className="text-gray-600 mt-1">Your latest products and their current status.</p>
              </div>
              <Link
                to="/my-products"
                className="text-sm font-semibold text-primary-600 hover:text-primary-700"
              >
                View all
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : recentProducts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800">No listings yet</h3>
                <p className="text-gray-500 mt-2 mb-6">
                  Start by adding your first product to your marketplace profile.
                </p>
                <Link
                  to="/create-product"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-600 text-white px-5 py-3 font-semibold hover:bg-primary-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Product
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentProducts.map((product) => (
                  <div
                    key={product._id}
                    className="flex flex-col md:flex-row md:items-center gap-4 rounded-2xl border border-gray-100 p-4 hover:border-primary-200 hover:shadow-sm transition-all"
                  >
                    <img
                      src={product.images?.[0] || 'https://via.placeholder.com/120?text=Product'}
                      alt={product.title}
                      className="w-full md:w-28 h-28 object-cover rounded-2xl bg-gray-100"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                            {product.title}
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">{product.location}</p>
                        </div>
                        <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold ${
                          product.isSold
                            ? 'bg-amber-100 text-amber-700'
                            : product.isActive
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-gray-100 text-gray-700'
                        }`}>
                          {product.isSold ? 'Sold' : product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-gray-600">
                        <span className="font-semibold text-primary-600">
                          INR {Number(product.price || 0).toLocaleString('en-IN')}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {product.views || 0} views
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock3 className="w-4 h-4" />
                          {new Date(product.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  to="/create-product"
                  className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-4 hover:border-primary-200 hover:bg-primary-50/40 transition-colors"
                >
                  <span className="font-medium text-gray-800">Create a new listing</span>
                  <Plus className="w-4 h-4 text-primary-600" />
                </Link>
                <Link
                  to="/my-products"
                  className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-4 hover:border-primary-200 hover:bg-primary-50/40 transition-colors"
                >
                  <span className="font-medium text-gray-800">Manage my products</span>
                  <ArrowRight className="w-4 h-4 text-primary-600" />
                </Link>
                <Link
                  to="/chat"
                  className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-4 hover:border-primary-200 hover:bg-primary-50/40 transition-colors"
                >
                  <span className="font-medium text-gray-800">Open chat</span>
                  <ArrowRight className="w-4 h-4 text-primary-600" />
                </Link>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">What&apos;s Next</h2>
              <p className="text-gray-600 leading-relaxed">
                Next milestone steps will grow this into a full user workspace with dashboard analytics,
                listing management, and admin-facing management tools.
              </p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SellerDashboard;
