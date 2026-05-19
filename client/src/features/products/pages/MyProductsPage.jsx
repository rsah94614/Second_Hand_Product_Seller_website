import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Edit, Trash2, Package, ToggleLeft, ToggleRight, MapPin, Eye, CheckCircle2, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { PRODUCT_FALLBACK_IMAGE, setFallbackImage } from '../../../lib/fallbackImages';
import { deleteProduct, getUserProducts, patchProduct, relistProduct } from '../api/productApi';

const MyProductsPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('All');

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ['user-products', user?.id],
    queryFn: () => getUserProducts(user?.id),
    enabled: !!user?.id,
  });

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(productId);
      toast.success('Product deleted successfully');
      refetch();
    } catch {
      toast.error('Failed to delete product');
    }
  };

  const toggleProductStatus = async (productId, currentStatus) => {
    try {
      await patchProduct(productId, { isActive: !currentStatus });
      toast.success(`Listing ${!currentStatus ? 'activated' : 'deactivated'}`);
      refetch();
    } catch {
      toast.error('Failed to update listing status');
    }
  };

  const markAsSold = async (productId) => {
    if (!window.confirm('Mark this item as sold? It will be removed from the marketplace.')) return;
    try {
      await patchProduct(productId, { isSold: true, isActive: false });
      toast.success('Item marked as sold');
      refetch();
    } catch {
      toast.error('Failed to mark as sold');
    }
  };

  const handleRelist = async (productId) => {
    try {
      await relistProduct(productId);
      toast.success('Listing relisted for another 60 days');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to relist');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f7f4ec_0%,#f8fafc_24%,#f8fafc_100%)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Please log in to view your products</h1>
          <Link to="/login"><Button>Login</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f4ec_0%,#f8fafc_24%,#f8fafc_100%)]">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Manage</p>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">My Products</h1>
          </div>
          <Link to="/create-product">
            <Button className="gap-2 rounded-full px-5">
              <Plus className="w-4 h-4" />
              List an Item
            </Button>
          </Link>
        </div>

        {!isLoading && products?.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {['All', 'Active', 'Sold', 'Inactive'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors shrink-0 ${
                  activeTab === tab
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="rounded-[1.75rem] bg-white shadow-sm overflow-hidden animate-pulse">
                <div className="aspect-4/3 bg-gray-100" />
                <div className="p-4 space-y-3">
                  <div className="h-4 rounded-full bg-gray-100 w-2/3" />
                  <div className="h-6 rounded-full bg-gray-100 w-1/2" />
                  <div className="h-8 rounded-full bg-gray-100 mt-2" />
                </div>
              </div>
            ))}
          </div>
        ) : products?.length === 0 ? (
          <div className="rounded-4xl border-2 border-dashed border-gray-200 bg-white/60 p-20 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gray-50 flex items-center justify-center mx-auto mb-5">
              <Package className="w-10 h-10 text-gray-300" />
            </div>
            <h2 className="text-2xl font-black text-gray-800 mb-3">No products yet</h2>
            <p className="text-gray-500 mb-8 text-sm">Start selling by listing your first product!</p>
            <Link to="/create-product">
              <Button className="rounded-full px-8 gap-2">
                <Plus className="w-4 h-4" /> List Your First Item
              </Button>
            </Link>
          </div>
        ) : (
          (() => {
            const filteredProducts = products?.filter(p => {
              if (activeTab === 'All') return true;
              if (activeTab === 'Active') return p.isActive && !p.isSold;
              if (activeTab === 'Sold') return p.isSold;
              if (activeTab === 'Inactive') return !p.isActive && !p.isSold;
              return true;
            });

            if (filteredProducts?.length === 0) {
              return (
                <div className="rounded-3xl border border-dashed border-gray-300 bg-white/50 p-12 text-center">
                  <p className="text-gray-500 font-medium">No products found for "{activeTab}".</p>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredProducts?.map((product) => (
                  <div
                    key={product._id}
                    className={`group rounded-[1.75rem] bg-white border border-gray-100 shadow-sm overflow-hidden transition-all duration-300 ${
                      product.isSold 
                        ? 'opacity-70 shadow-none border-gray-150' 
                        : 'hover:-translate-y-1 hover:shadow-xl hover:border-gray-200'
                    }`}
                  >
                    {/* Image */}
                    <div className="relative aspect-4/3 overflow-hidden bg-gray-50">
                      <img
                        src={product.images?.[0] || PRODUCT_FALLBACK_IMAGE}
                        alt={product.title}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                        onError={setFallbackImage}
                      />
                      {/* Status badges */}
                      <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                        {product.isSold && (
                          <span className="px-2.5 py-1 rounded-full bg-red-500 text-white text-xs font-bold tracking-wide">SOLD</span>
                        )}
                        {!product.isActive && !product.isSold && (
                          <span className="px-2.5 py-1 rounded-full bg-amber-400 text-white text-xs font-bold tracking-wide">INACTIVE</span>
                        )}
                        {product.isActive && !product.isSold && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold tracking-wide">ACTIVE</span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <h3 className="font-bold text-gray-900 line-clamp-1 mb-1 group-hover:text-primary-700 transition-colors">
                        {product.title}
                      </h3>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xl font-black text-gray-900">
                          ₹{product.price?.toLocaleString('en-IN')}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Eye className="w-3.5 h-3.5" />
                          {product.views || 0}
                        </div>
                      </div>
                      {product.location && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{product.location}</span>
                        </div>
                      )}

                      {/* Expiry info */}
                      {product.daysRemaining !== null && product.daysRemaining !== undefined && !product.isSold && (
                        <div className={`flex items-center gap-1 text-xs mb-3 ${product.isExpiringSoon ? 'text-amber-600 font-semibold' : 'text-gray-400'}`}>
                          {product.isExpiringSoon && <AlertTriangle className="w-3 h-3" />}
                          {product.daysRemaining > 0 ? `Expires in ${product.daysRemaining}d` : 'Expired'}
                        </div>
                      )}

                      {product.isSold ? (
                        /* Sold States Action & Success Banner */
                        <div className="space-y-2 mt-2">
                          <Button
                            onClick={() => handleDelete(product._id)}
                            variant="outline"
                            size="sm"
                            className="w-full gap-1.5 rounded-xl text-xs text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove Listing
                          </Button>
                          <div className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center gap-1.5">
                            <span className="text-sm">🎉</span>
                            <span className="text-xs font-bold text-emerald-800 tracking-tight">Deal Completed Successfully!</span>
                          </div>
                        </div>
                      ) : (
                        /* Active/Inactive States Actions */
                        <>
                          <div className="flex gap-2 mb-2">
                            <Link to={`/edit-product/${product._id}`} className="flex-1">
                              <Button variant="outline" size="sm" className="w-full gap-1.5 rounded-xl text-xs">
                                <Edit className="w-3.5 h-3.5" /> Edit
                              </Button>
                            </Link>
                            <Button
                              onClick={() => markAsSold(product._id)}
                              variant="outline"
                              size="sm"
                              className="flex-1 gap-1.5 rounded-xl text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Sold
                            </Button>
                            <Button
                              onClick={() => handleDelete(product._id)}
                              variant="outline"
                              size="sm"
                              className="rounded-xl text-red-500 border-red-200 hover:bg-red-50 hover:border-red-300 px-2.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>

                          {/* Toggle active */}
                          <button
                            onClick={() => toggleProductStatus(product._id, product.isActive)}
                            className={`w-full flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold transition-all ${
                              product.isActive
                                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                : 'bg-primary-50 text-primary-700 border border-primary-200 hover:bg-primary-100'
                            }`}
                          >
                            {product.isActive ? (
                              <><ToggleRight className="w-4 h-4 text-emerald-500" /> Deactivate</>
                            ) : (
                              <><ToggleLeft className="w-4 h-4" /> Activate</>
                            )}
                          </button>

                          {/* Relist button for expired/inactive listings */}
                          {(product.isExpired || !product.isActive) && (
                            <button
                              onClick={() => handleRelist(product._id)}
                              className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl py-2 text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-all"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Relist (60 days)
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
            ))}
            </div>
          );
        })()
      )}
      </div>
      <Footer />
    </div>
  );
};

export default MyProductsPage;
