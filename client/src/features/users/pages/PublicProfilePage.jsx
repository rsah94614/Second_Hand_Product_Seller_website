import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Star, MessageSquare, Package, Shield, Award, Calendar, ShoppingBag, User } from 'lucide-react';
import { PageShell } from '../../../components/layout/PageShell';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useAuth } from '../../../context/AuthContext';
import { getUserProfile } from '../api/userApi';
import { getCampusPickupLabel } from '../../../lib/campus';

const getTrustLabelColor = (colorStr) => {
  const map = {
    green: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
  };
  return map[colorStr] || map.gray;
};

// eslint-disable-next-line no-unused-vars
const StatCard = ({ icon: Icon, value, label, color = 'text-primary-600' }) => (
  <div className="flex flex-col items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
    <Icon className={`w-5 h-5 mb-1.5 ${color}`} />
    <p className={`text-xl font-black ${color}`}>{value}</p>
    <p className="text-xs font-semibold text-gray-500 text-center mt-0.5">{label}</p>
  </div>
);

export default function PublicProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const { data, isLoading, error } = useQuery({
    queryKey: ['publicProfile', id],
    queryFn: () => getUserProfile(id),
    enabled: !!id,
  });

  const profile = data?.user;
  const recentProducts = data?.recentProducts || [];
  const trustSignals = data?.trustSignals || {};

  const isOwnProfile = currentUser?.id === id || currentUser?.id === profile?._id;

  const handleMessage = () => {
    navigate('/chat', { state: { sellerId: id, sellerName: profile?.name } });
  };

  if (isLoading) {
    return (
      <PageShell>
        <div className="px-4 sm:px-6 py-8 md:py-12">
          <div className="max-w-4xl mx-auto animate-pulse space-y-6">
            <div className="h-8 w-32 bg-gray-200 rounded-xl" />
            <div className="bg-white rounded-4xl p-8 shadow-sm border border-gray-100">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-gray-200" />
                <div className="space-y-3 flex-1">
                  <div className="h-7 w-48 bg-gray-200 rounded-xl" />
                  <div className="h-4 w-32 bg-gray-200 rounded-xl" />
                  <div className="flex gap-2">
                    <div className="h-6 w-20 bg-gray-200 rounded-full" />
                    <div className="h-6 w-24 bg-gray-200 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-2xl" />)}
            </div>
            <div className="bg-white rounded-4xl p-8 shadow-sm border border-gray-100">
              <div className="h-6 w-40 bg-gray-200 rounded-xl mb-6" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-gray-200 rounded-2xl" />)}
              </div>
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  if (error || !profile) {
    return (
      <PageShell>
        <div className="px-4 sm:px-6 py-16 text-center max-w-md mx-auto">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-3">Profile Not Found</h1>
          <p className="text-gray-500 mb-8">This user's profile doesn't exist or has been removed.</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
          </Button>
        </div>
      </PageShell>
    );
  }

  const initials = profile.name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'U';
  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const locationLabel = profile.location ? getCampusPickupLabel(profile.location) : null;

  return (
    <PageShell>
      <div className="px-4 sm:px-6 py-8 md:py-12">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-primary-600 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back
          </button>

          {/* Hero Card */}
          <div className="bg-white rounded-4xl shadow-[0_8px_30px_rgb(0,0,0,0.05)] border border-gray-100 overflow-hidden animate-fade-in">
            {/* Banner */}
            <div className="h-28 bg-linear-to-r from-primary-500 via-primary-600 to-indigo-600" />
            <div className="px-6 sm:px-8 pb-8">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-12">
                <div className="flex items-end gap-4">
                  <div className="relative">
                    {profile.avatar ? (
                      <img
                        src={profile.avatar}
                        alt={profile.name}
                        className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-linear-to-br from-primary-400 to-indigo-500 flex items-center justify-center border-4 border-white shadow-lg">
                        <span className="text-3xl font-black text-white">{initials}</span>
                      </div>
                    )}
                    {trustSignals?.trustLabels?.some(l => l.key === 'verified') && (
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                        <Shield className="w-3.5 h-3.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="mb-1">
                    <h1 className="text-2xl font-black text-gray-900 leading-tight">{profile.name}</h1>
                    {locationLabel && (
                      <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5" /> {locationLabel}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 font-medium flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3" /> Member since {memberSince}
                    </p>
                  </div>
                </div>
                {!isOwnProfile && currentUser && (
                  <button
                    onClick={handleMessage}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl transition-all active:scale-95 shadow-md shadow-primary-200 text-sm"
                  >
                    <MessageSquare className="w-4 h-4" /> Message
                  </button>
                )}
              </div>

              {/* Trust Badges */}
              {trustSignals?.trustLabels?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-5">
                  {trustSignals.trustLabels.map(label => (
                    <Badge
                      key={label.key}
                      className={`border px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase bg-white ${getTrustLabelColor(label.color)}`}
                    >
                      {label.label}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Campus Info */}
              {(profile.campus?.department || profile.campus?.course || profile.profileRole) && (
                <div className="mt-5 pt-5 border-t border-gray-100 flex flex-wrap gap-4 text-sm text-gray-600">
                  {profile.profileRole && (
                    <span className="font-semibold text-gray-800 capitalize">{profile.profileRole.replace(/_/g, ' ')}</span>
                  )}
                  {profile.campus?.department && (
                    <span className="text-gray-500">{profile.campus.department}</span>
                  )}
                  {profile.campus?.course && profile.campus?.year && (
                    <span className="text-gray-500">{profile.campus.course} · Year {profile.campus.year}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-up-delayed">
            <StatCard
              icon={Star}
              value={trustSignals.averageRating ? Number(trustSignals.averageRating).toFixed(1) : '—'}
              label="Avg Rating"
              color="text-amber-500"
            />
            <StatCard
              icon={Package}
              value={trustSignals.completedOrders ?? 0}
              label="Orders Done"
              color="text-emerald-600"
            />
            <StatCard
              icon={ShoppingBag}
              value={recentProducts.length}
              label="Active Listings"
              color="text-primary-600"
            />
            <StatCard
              icon={Award}
              value={trustSignals.reviewCount ?? 0}
              label="Reviews"
              color="text-indigo-600"
            />
          </div>

          {/* Active Listings */}
          {recentProducts.length > 0 && (
            <div className="bg-white rounded-4xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 animate-fade-in">
              <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary-600" />
                Active Listings
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {recentProducts.map(product => (
                  <Link
                    key={product._id}
                    to={`/products/${product._id}`}
                    className="group block rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:border-primary-200 transition-all"
                  >
                    <div className="aspect-square bg-gray-100 overflow-hidden">
                      {product.images?.[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-10 h-10 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-sm font-bold text-gray-900 line-clamp-2 leading-tight">{product.title}</p>
                      <p className="text-sm font-black text-primary-600 mt-1">
                        ₹{product.price?.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          {profile.reviews?.length > 0 && (
            <div className="bg-white rounded-4xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" />
                  Seller Reviews
                </h2>
                <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-black text-amber-700">
                    {Number(trustSignals.averageRating || 0).toFixed(1)}
                  </span>
                  <span className="text-xs text-amber-600 font-semibold">/ 5</span>
                </div>
              </div>
              <div className="space-y-4">
                {profile.reviews.slice(0, 8).map((review, idx) => (
                  <div key={review._id || idx} className="rounded-2xl border border-gray-100 bg-gray-50/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-black">
                          {review.user?.name?.[0] || '?'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{review.user?.name || 'Anonymous'}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(review.updatedAt || review.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-black text-amber-700">{review.rating}</span>
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600 leading-relaxed ml-10">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {recentProducts.length === 0 && (!profile.reviews || profile.reviews.length === 0) && (
            <div className="bg-white rounded-4xl p-12 shadow-sm border border-gray-100 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No listings or reviews yet.</p>
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
