import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Briefcase, Eye, Plus, Package, CheckCircle2, Clock3, ArrowRight, TrendingUp, Sparkles, Lightbulb } from 'lucide-react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { useAuth } from '../../../context/AuthContext';
import { PRODUCT_FALLBACK_IMAGE, setFallbackImage } from '../../../lib/fallbackImages';
import { getUserProducts, patchProduct } from '../api/productApi';
import { ErrorState } from '../../../components/ui/ErrorState';

const DashboardPage = () => {
  const { user } = useAuth();

  const { data: products = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['user-dashboard-products', user?.id],
    queryFn: () => getUserProducts(user?.id),
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
    { totalListings: 0, activeListings: 0, soldListings: 0, inactiveListings: 0, totalViews: 0 }
  );

  const markAsSold = async (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Mark this item as sold?')) return;
    try {
      await patchProduct(productId, { isSold: true, isActive: false });
      toast.success('Item marked as sold');
      refetch();
    } catch {
      toast.error('Failed to mark as sold');
    }
  };

  const actionableInsights = () => {
    const zeroViews = products.filter(p => p.isActive && !p.isSold && (p.views || 0) === 0);
    if (zeroViews.length > 0) {
      return `You have ${zeroViews.length} active listing(s) with 0 views. Consider improving your titles or photos.`;
    }
    const stagnant = products.filter(p => !p.isActive && !p.isSold);
    if (stagnant.length > 0) {
      return `You have ${stagnant.length} inactive listing(s). Reactivate them to find buyers.`;
    }
    return "All your active listings are getting views! Keep up the good work.";
  };

  const recentProducts = [...products]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 4);

  const statCards = [
    {
      label: 'Total Listings',
      value: metrics.totalListings,
      icon: Briefcase,
      gradient: 'from-primary-600 to-indigo-600',
      bg: 'bg-primary-50',
      iconColor: 'text-primary-600',
    },
    {
      label: 'Active',
      value: metrics.activeListings,
      icon: Package,
      gradient: 'from-emerald-500 to-teal-500',
      bg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
    },
    {
      label: 'Sold',
      value: metrics.soldListings,
      icon: CheckCircle2,
      gradient: 'from-amber-500 to-orange-500',
      bg: 'bg-amber-50',
      iconColor: 'text-amber-600',
    },
    {
      label: 'Total Views',
      value: metrics.totalViews,
      icon: Eye,
      gradient: 'from-violet-600 to-purple-600',
      bg: 'bg-violet-50',
      iconColor: 'text-violet-600',
    },
  ];

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <ErrorState
            title="Could not load your dashboard"
            description="There was a problem fetching your listings. Please try again."
            onRetry={refetch}
          />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f4ec_0%,#f8fafc_24%,#f8fafc_100%)]">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Hero Banner */}
        <section className="relative overflow-hidden rounded-4xl mb-8 bg-slate-900 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)]">
          <div className="absolute inset-0 bg-linear-to-br from-primary-900 via-indigo-900 to-blue-950 opacity-90" />
          <div className="absolute top-[-30%] right-[-5%] w-[50%] h-[200%] rounded-full bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-primary-500/20 via-transparent to-transparent blur-3xl" />
          <div className="absolute bottom-[-20%] left-[-5%] w-[40%] h-[160%] rounded-full bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-cyan-400/10 via-transparent to-transparent blur-3xl" />
          <div className="relative z-10 p-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-semibold text-white/80 mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                Seller Dashboard
              </div>
              <h1 className="text-4xl font-black text-white leading-tight tracking-tight">
                Welcome back,{' '}
                <span className="bg-clip-text text-transparent bg-linear-to-r from-white to-cyan-200">
                  {user?.name}
                </span>
              </h1>
              <p className="text-primary-200/70 mt-3 max-w-xl leading-relaxed">
                Manage your listings, track interest, and keep your marketplace presence active.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              <Link to="/create-product">
                <Button variant="outline" className="gap-2 rounded-full px-6 py-3 border-white/30 text-white bg-indigo-900 hover:border-white/50 hover:bg-indigo-950">
                  <Plus className="w-4 h-4" />
                  List an Item
                </Button>
              </Link>
              <Link to="/my-products">
                <Button variant="outline" className="gap-2 rounded-full px-6 py-3 border-white/30 text-white bg-indigo-900 hover:border-white/50 hover:bg-indigo-950">
                  Manage Listings
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Stat Cards */}
        <section className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
          {statCards.map((card) => {
            const StatIcon = card.icon;
            return (
              <div
                key={card.label}
                className="relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm p-6 hover:-translate-y-0.5 transition-transform duration-200"
              >
                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full ${card.bg} -translate-y-1/2 translate-x-1/2 blur-2xl opacity-60`} />
                <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl ${card.bg} ${card.iconColor} mb-4`}>
                  <StatIcon className="w-5 h-5" />
                </div>
                <p className="text-sm font-semibold text-gray-500">{card.label}</p>
                <p className={`text-4xl font-black mt-1 bg-clip-text text-transparent bg-linear-to-r ${card.gradient}`}>
                  {card.value}
                </p>
              </div>
            );
          })}
        </section>

        {/* Main Content */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Recent Listings */}
          <Card className="xl:col-span-2 rounded-3xl border border-gray-100 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">Recent Listings</h2>
                  <p className="text-gray-500 text-sm mt-1">Your latest products and their current status.</p>
                </div>
                <Link
                  to="/my-products"
                  className="text-sm font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1.5 group"
                >
                  View all <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
                  ))}
                </div>
              ) : recentProducts.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                    <Package className="w-8 h-8 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">No listings yet</h3>
                  <p className="text-gray-500 mt-2 mb-6 text-sm">
                    Start by adding your first product to the marketplace.
                  </p>
                  <Link to="/create-product">
                    <Button className="gap-2 rounded-full px-6">
                      <Plus className="w-4 h-4" />
                      Create Product
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {recentProducts.map((product) => (
                    <Link
                      key={product._id}
                      to={`/products/${product._id}`}
                      className="flex items-center gap-4 py-4 hover:bg-gray-50/60 rounded-2xl px-3 -mx-3 transition-colors group"
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                        <img
                          src={product.images?.[0] || PRODUCT_FALLBACK_IMAGE}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={setFallbackImage}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                          {product.title}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
                          <span className="font-bold text-primary-600 text-sm">
                            ₹{Number(product.price || 0).toLocaleString('en-IN')}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5" />
                            {product.views || 0} views
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Clock3 className="w-3.5 h-3.5" />
                            {new Date(product.createdAt).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                      </div>
                      <Badge
                        className={`shrink-0 px-3 py-1 text-xs font-bold rounded-full border-0 ${
                          product.isSold
                            ? 'bg-amber-100 text-amber-700'
                            : product.isActive
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {product.isSold ? 'Sold' : product.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {!product.isSold && (
                        <Button
                          onClick={(e) => markAsSold(e, product._id)}
                          variant="outline"
                          size="sm"
                          className="shrink-0 gap-1.5 rounded-xl text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Sold
                        </Button>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sidebar */}
          <div className="space-y-5">
            <Card className="rounded-3xl border border-gray-100 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-black">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-1">
                <div className="space-y-2">
                  {[
                    { to: '/create-product', label: 'Create a new listing', icon: Plus },
                    { to: '/my-products', label: 'Manage my products', icon: Package },
                    { to: '/chat', label: 'Messages', icon: TrendingUp },
                    { to: '/profile', label: 'Edit profile', icon: ArrowRight },
                  ].map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3.5 hover:border-primary-200 hover:bg-primary-50/40 transition-all group"
                    >
                      <span className="font-semibold text-gray-800 text-sm group-hover:text-primary-700 transition-colors">
                        {item.label}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-primary-100 flex items-center justify-center transition-colors">
                        <item.icon className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors" />
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actionable Tip Card */}
            <Card className="rounded-3xl border-gray-100 shadow-sm overflow-hidden relative bg-amber-50">
              <CardContent className="p-6 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center mb-4">
                  <Lightbulb className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="text-gray-900 font-black text-lg tracking-tight">Seller Tip</h3>
                <p className="text-gray-700 text-sm mt-2 leading-relaxed">
                  {actionableInsights()}
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DashboardPage;
