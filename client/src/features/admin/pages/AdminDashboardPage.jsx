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
  UserX,
  AlertCircle,
  Clock,
  ExternalLink,
  BarChart3,
  TrendingUp,
  Gavel,
  ListChecks,
  BadgeCheck,
} from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
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
      label: 'Platform Users',
      value: metrics.totalUsers || 0,
      icon: Users,
      tone: 'from-blue-600 to-indigo-700 text-white',
      bgTone: 'bg-blue-500/10 text-blue-600',
    },
    {
      label: 'Active Listings',
      value: metrics.activeProducts || 0,
      icon: Package,
      tone: 'from-emerald-500 to-teal-700 text-white',
      bgTone: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      label: 'Total Orders',
      value: metrics.totalOrders || 0,
      icon: ShoppingBag,
      tone: 'from-amber-500 to-orange-600 text-white',
      bgTone: 'bg-amber-500/10 text-amber-600',
    },
    {
      label: 'Platform Revenue',
      value: new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
      }).format(metrics.totalRevenue || 0),
      icon: IndianRupee,
      tone: 'from-violet-500 to-purple-700 text-white',
      bgTone: 'bg-violet-500/10 text-violet-600',
    },
    {
      label: 'Flagged Posts',
      value: metrics.flaggedListings || 0,
      icon: AlertCircle,
      tone: 'from-rose-500 to-red-700 text-white',
      bgTone: 'bg-rose-500/10 text-rose-600',
    },
    {
      label: 'Suspended',
      value: metrics.suspendedUsers || 0,
      icon: UserX,
      tone: 'from-slate-700 to-slate-900 text-white',
      bgTone: 'bg-slate-500/10 text-slate-600',
    },
    {
      label: 'Open Disputes',
      value: metrics.openDisputes || 0,
      icon: Gavel,
      tone: 'from-fuchsia-500 to-pink-700 text-white',
      bgTone: 'bg-fuchsia-500/10 text-fuchsia-600',
    },
    {
      label: 'Mod Queue',
      value: metrics.pendingModeration || 0,
      icon: ListChecks,
      tone: 'from-pink-500 to-rose-600 text-white',
      bgTone: 'bg-pink-500/10 text-pink-600',
    },
    {
      label: 'Pending Verifications',
      value: metrics.pendingVerifications || 0,
      icon: BadgeCheck,
      tone: 'from-cyan-500 to-blue-600 text-white',
      bgTone: 'bg-cyan-500/10 text-cyan-600',
    },
    {
      label: 'Open Reports',
      value: metrics.openReports || 0,
      icon: Flag,
      tone: 'from-orange-500 to-red-600 text-white',
      bgTone: 'bg-orange-500/10 text-orange-600',
    },
  ];

  const adminTools = [
    {
      label: 'Sales & Revenue Reports',
      description: 'Access comprehensive analytics, dashboards, and business intelligence reports.',
      to: '/admin/reports-hub',
      icon: IndianRupee,
      isNew: true,
    },
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
    {
      label: 'Manage Disputes',
      description: 'Review and resolve order conflicts between buyers and sellers.',
      to: '/admin/disputes',
      icon: Gavel,
    },
    {
      label: 'Moderation Queue',
      description: 'Review flagged content and pending items in the moderation queue.',
      to: '/admin/moderation-queue',
      icon: ListChecks,
    },
    {
      label: 'Seller Verifications',
      description: 'Review identity documents and approve or reject seller applications.',
      to: '/admin/seller-verifications',
      icon: BadgeCheck,
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
        <section className="bg-white rounded-4xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6 sm:p-10 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-50/50 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 relative z-10 text-center sm:text-left">
            <div>
              <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.3em] text-red-600 mb-2">
                Executive Control
              </p>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-gray-900 leading-tight">
                Marketplace <span className="text-transparent bg-clip-text bg-linear-to-r from-red-600 to-rose-600">Intelligence</span>
              </h1>
              <p className="text-sm sm:text-lg text-gray-600 mt-4 max-w-2xl leading-relaxed font-medium">
                High-level observability into users, products, and campus transactions. Refine moderation and platform health in real-time.
              </p>
            </div>
            <div className="inline-flex shrink-0 items-center gap-3 rounded-2xl bg-gray-900 text-white px-5 py-3 font-bold text-sm shadow-lg shadow-gray-900/20">
              <ShieldCheck className="w-5 h-5 text-red-500" />
              Master Admin
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-10">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="bg-white rounded-3xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-300 group"
              >
                <div className={`w-10 h-10 rounded-xl ${card.bgTone} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{card.label}</p>
                <h3 className="text-2xl font-black text-gray-900 mt-1">{card.value}</h3>
              </div>
            );
          })}
        </section>

        {/* Sales Dashboard Quick Access Banner */}
        <section className="mb-8">
          <Link
            to="/admin/sales-dashboard"
            className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 bg-linear-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all duration-300"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center flex-none group-hover:scale-110 transition-transform">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-xs font-black text-blue-200 uppercase tracking-[0.25em]">New Feature</p>
                  <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-widest border border-white/30">Live</span>
                </div>
                <h2 className="text-2xl font-black text-white leading-tight">Sales &amp; Revenue Dashboard</h2>
                <p className="text-blue-100 text-sm mt-1 font-medium">Revenue trends · Top products · Seller rankings · Category breakdown · PDF export</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-2xl font-black text-sm shadow-lg flex-none group-hover:bg-blue-50 transition-colors">
              <TrendingUp className="w-4 h-4" />
              Open Dashboard
            </div>
          </Link>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-12">
          {adminTools.map((tool) => {
            const Icon = tool.icon;

            return (
              <Link
                key={tool.label}
                to={tool.to}
                className="group relative bg-white rounded-[1.75rem] border border-gray-100 shadow-sm p-6 transition-all duration-300 hover:border-red-500/30 hover:shadow-xl hover:shadow-red-500/5 hover:-translate-y-1 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-red-50/30 rounded-full -mr-12 -mt-12 transition-transform duration-500 group-hover:scale-150" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-red-500 to-rose-600 text-white flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:rotate-6 transition-transform">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-2">
                      {tool.isNew && (
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest border border-blue-200">New</span>
                      )}
                      <div className="p-2 rounded-xl bg-gray-50 text-gray-400 group-hover:text-red-600 group-hover:bg-red-50 transition-colors">
                        <ExternalLink className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                  <h2 className="text-xl font-black text-gray-900">{tool.label}</h2>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed font-medium">{tool.description}</p>
                </div>
              </Link>
            );
          })}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-10">
          <div className="xl:col-span-2 bg-white rounded-4xl border border-gray-100 shadow-xl shadow-gray-200/40 p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Performance Ranking</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="w-8 h-1 bg-red-600 rounded-full" />
                  <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Trending Marketplace Objects</p>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="h-20 rounded-2xl bg-gray-50 animate-pulse border border-gray-100" />
                ))}
              </div>
            ) : data?.topProducts?.length ? (
              <div className="divide-y divide-gray-50">
                {data.topProducts.map((product, index) => (
                  <div
                    key={product._id}
                    className="flex items-center gap-6 py-4 group first:pt-0 last:pb-0"
                  >
                    <div className="w-8 flex-none text-2xl font-black text-gray-200 group-hover:text-red-600 transition-colors">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <img
                      src={product.images?.[0] || PRODUCT_FALLBACK_IMAGE}
                      alt={product.title}
                      className="w-16 h-16 object-cover rounded-xl bg-gray-50 shadow-sm flex-none"
                      onError={setFallbackImage}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-bold text-gray-900 truncate">{product.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="px-2 py-0 text-[10px] font-bold uppercase">{product.category}</Badge>
                        <span className="text-xs text-gray-400 font-medium">• {product.location}</span>
                      </div>
                    </div>
                    <div className="flex-none text-right">
                      <p className="text-xs text-gray-400 font-black uppercase tracking-wider">Reach</p>
                      <div className="flex items-center gap-1.5 justify-end mt-0.5">
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-lg font-black text-gray-900 leading-none">{product.views || 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-gray-200 p-16 text-center">
                <Package className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Awaiting Market Metrics</p>
              </div>
            )}
          </div>

          <div className="space-y-6 flex flex-col">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/40 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  Active Users
                </h2>
                <Link to="/admin/users" className="text-[10px] font-black uppercase text-red-600 hover:underline">View All</Link>
              </div>
              <div className="space-y-4">
                {(data?.recentUsers || []).map((user) => (
                   <div
                    key={user._id}
                    className="flex items-center gap-3 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-black text-xs border border-white shadow-sm flex-none group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                      {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{user.name}</p>
                      <p className="text-[10px] text-gray-400 font-medium truncate">{user.email}</p>
                    </div>
                    <Badge variant="outline" className="px-1.5 py-0 text-[8px] font-black uppercase border-gray-200 text-gray-400">{user.role}</Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/40 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  Recent Flow
                </h2>
              </div>
              <div className="space-y-5">
                {(data?.recentOrders || []).map((order) => (
                  <div
                    key={order._id}
                    className="flex items-center justify-between group"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black text-gray-900">ORD-{order._id.slice(-4).toUpperCase()}</p>
                        <Badge
                          className={`text-[8px] font-black uppercase px-1.5 py-0 border-transparent ${
                            order.status === 'completed'
                              ? 'bg-emerald-500 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {order.status}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-tight">
                        {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(order.total)}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-[10px] text-gray-400 font-medium whitespace-nowrap">{formatDate(order.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-lg shadow-gray-200/40 p-6">
              <div className="flex items-center gap-2 mb-6">
                <FolderTree className="w-4 h-4 text-emerald-500" />
                <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest">Category Distribution</h2>
              </div>
              <div className="space-y-4">
                {(data?.categoryBreakdown || []).map((entry) => (
                  <div key={entry.category} className="group">
                    <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-tighter text-gray-500 mb-1.5 transition-colors group-hover:text-gray-900">
                      <span>{entry.category}</span>
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-900">{entry.count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-50 overflow-hidden border border-gray-100/50">
                      <div
                        className="h-full bg-linear-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000"
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
