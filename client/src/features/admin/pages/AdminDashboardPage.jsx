import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Users,
  Package,
  ShoppingBag,
  IndianRupee,
  ArrowUpRight,
  FolderTree,
  Flag,
} from 'lucide-react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { PRODUCT_FALLBACK_IMAGE, setFallbackImage } from '../../../lib/fallbackImages';
import { getAdminOverview } from '../api/adminApi';

const AdminDashboardPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-overview'],
    queryFn: getAdminOverview,
  });

  const metrics = data?.metrics || {};

  const cards = [
    {
      label: 'Total Users',
      value: metrics.totalUsers || 0,
      icon: Users,
      tone: 'bg-blue-50 text-blue-700 border-blue-100',
    },
    {
      label: 'Active Products',
      value: metrics.activeProducts || 0,
      icon: Package,
      tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    },
    {
      label: 'Total Orders',
      value: metrics.totalOrders || 0,
      icon: ShoppingBag,
      tone: 'bg-amber-50 text-amber-700 border-amber-100',
    },
    {
      label: 'Revenue',
      value: new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(metrics.totalRevenue || 0),
      icon: IndianRupee,
      tone: 'bg-violet-50 text-violet-700 border-violet-100',
    },
    {
      label: 'Open Reports',
      value: metrics.openReports || 0,
      icon: Flag,
      tone: 'bg-rose-50 text-rose-700 border-rose-100',
    },
  ];

  const adminTools = [
    {
      label: 'Manage Users',
      description: 'Change roles, verify accounts, and deactivate abusive users.',
      to: '/admin/users',
      icon: Users,
    },
    {
      label: 'Moderate Products',
      description: 'Review listings, disable unsafe posts, and clean the catalog.',
      to: '/admin/products',
      icon: Package,
    },
    {
      label: 'Manage Categories',
      description: 'Control the category set used by user listing forms and marketplace filters.',
      to: '/admin/categories',
      icon: FolderTree,
    },
    {
      label: 'Monitor Orders',
      description: 'Track all orders, inspect shipping details, and update delivery status.',
      to: '/admin/orders',
      icon: ShoppingBag,
    },
    {
      label: 'Review Reports',
      description: 'Handle product and user reports submitted by marketplace members.',
      to: '/admin/reports',
      icon: Flag,
    },
    {
      label: 'Observability & Audit',
      description: 'Monitor server health status and track immutable administrative audit logs.',
      to: '/admin/audit-logs',
      icon: ShieldCheck,
    },
  ];

  const formatDate = (value) =>
    new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-8 mb-8">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
            <div>
              <p className="text-xs sm:text-sm font-medium uppercase tracking-[0.2em] text-red-600">
                Admin Console
              </p>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 mt-2">
                Platform Overview
              </h1>
              <p className="text-sm sm:text-base text-gray-600 mt-3 max-w-2xl leading-relaxed">
                Monitor users, products, orders, reports, and platform activity. Use the tools below to moderate the marketplace and keep it running smoothly.
              </p>
            </div>
            <div className="inline-flex shrink-0 items-center gap-2 rounded-full bg-red-50 text-red-700 px-4 py-2 font-bold text-sm">
              <ShieldCheck className="w-4 h-4" />
              Admin Access
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className={`rounded-2xl border p-6 shadow-sm ${card.tone}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{card.label}</span>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-3xl font-bold mt-4">{card.value}</p>
              </div>
            );
          })}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-4 gap-5 mb-8">
          {adminTools.map((tool) => {
            const Icon = tool.icon;

            return (
              <Link
                key={tool.label}
                to={tool.to}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:border-red-200 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-700 flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mt-5">{tool.label}</h2>
                <p className="text-gray-600 mt-2">{tool.description}</p>
              </Link>
            );
          })}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Top Products</h2>
                <p className="text-gray-600 mt-1">Listings receiving the highest attention right now.</p>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : data?.topProducts?.length ? (
              <div className="space-y-4">
                {data.topProducts.map((product) => (
                  <div
                    key={product._id}
                    className="flex flex-col md:flex-row md:items-center gap-4 rounded-2xl border border-gray-100 p-4"
                  >
                    <img
                      src={product.images?.[0] || PRODUCT_FALLBACK_IMAGE}
                      alt={product.title}
                      className="w-full md:w-24 h-24 object-cover rounded-2xl bg-gray-100"
                      onError={setFallbackImage}
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{product.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {product.category} | {product.location}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Views</p>
                      <p className="text-xl font-bold text-gray-900">{product.views || 0}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-gray-500">
                No product data yet.
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Users</h2>
              <div className="space-y-3">
                {(data?.recentUsers || []).map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{user.role}</p>
                      <p className="text-sm text-gray-500">{formatDate(user.createdAt)}</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Orders</h2>
              <div className="space-y-3">
                {(data?.recentOrders || []).map((order) => (
                  <div
                    key={order._id}
                    className="rounded-2xl border border-gray-100 px-4 py-3"
                  >
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-gray-800">#{order._id.slice(-6).toUpperCase()}</p>
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{formatDate(order.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Category Mix</h2>
              <div className="space-y-3">
                {(data?.categoryBreakdown || []).map((entry) => (
                  <div key={entry.category}>
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                      <span>{entry.category}</span>
                      <span>{entry.count}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-primary-600 rounded-full"
                        style={{
                          width: `${Math.min(100, (entry.count / Math.max(data.categoryBreakdown[0]?.count || 1, 1)) * 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AdminDashboardPage;
