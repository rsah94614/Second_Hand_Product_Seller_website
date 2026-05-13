import React, { useMemo, useState } from 'react';
import { useMutation, useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Search, ShieldCheck, Trash2, Loader2 } from 'lucide-react';
import axios from 'axios';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/Select';
import { DEFAULT_PRODUCT_CATEGORIES } from '../../../config/productOptions';
import { API_BASE_URL } from '../../../config/api';
import { PRODUCT_FALLBACK_IMAGE, setFallbackImage } from '../../../lib/fallbackImages';
import {
  deleteAdminProduct,
  getAdminProducts,
  updateAdminProduct,
  getAdminSuspiciousProducts,
} from '../api/adminApi';

const AdminProductsPage = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
    viewMode: 'all',
  });

  const fetchProducts = async ({ pageParam = null }) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== 'viewMode') params.set(key, value);
    });
    if (pageParam) params.set('cursor', pageParam);
    params.set('limit', '50');

    if (filters.viewMode === 'suspicious') {
      return getAdminSuspiciousProducts(params.toString());
    }
    return getAdminProducts(params.toString());
  };

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['admin-products', filters],
    queryFn: fetchProducts,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
  });

  const { data: categoryResponse } = useQuery({
    queryKey: ['product-categories'],
    queryFn: () => axios.get(`${API_BASE_URL}/api/categories`).then((res) => res.data),
  });

  const categories = useMemo(() => {
    const names = categoryResponse?.categories?.map((category) => category.name) || DEFAULT_PRODUCT_CATEGORIES;
    return [...new Set(names)];
  }, [categoryResponse]);

  const updateProductMutation = useMutation({
    mutationFn: ({ productId, payload }) => updateAdminProduct(productId, payload),
    onSuccess: (response) => {
      toast.success(response.message || 'Product updated');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to update product');
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (productId) => deleteAdminProduct(productId),
    onSuccess: (response) => {
      toast.success(response.message || 'Product deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to delete product');
    },
  });

  const products = useMemo(() => {
    const raw = data?.pages.flatMap((page) => page.products) || [];
    const seen = new Set();
    return raw.filter((p) => {
      if (!p?._id || seen.has(p._id)) return false;
      seen.add(p._id);
      return true;
    });
  }, [data]);

  const formatPrice = (value) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value || 0);

  const getStatusLabel = (product) => {
    if (product.isSold) {
      return { label: 'Sold', tone: 'bg-amber-100 text-amber-700' };
    }

    if (product.isActive) {
      return { label: 'Active', tone: 'bg-emerald-100 text-emerald-700' };
    }

    return { label: 'Inactive', tone: 'bg-gray-200 text-gray-700' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-red-600">
                Admin Tools
              </p>
              <h1 className="text-4xl font-bold text-gray-900 mt-2">Product Moderation</h1>
              <p className="text-gray-600 mt-3 max-w-2xl">
                Review listings across the marketplace, disable unsafe posts, and keep catalog quality high.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 text-red-700 px-4 py-2 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              Admin Only
            </div>
          </div>
        </section>

        <Card className="rounded-2xl border-gray-100 shadow-sm mb-8 animate-fade-up-delayed">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Input
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                placeholder="Search products..."
                className="pl-10"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <Select value={filters.viewMode} onValueChange={(value) => setFilters((prev) => ({ ...prev, viewMode: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                <SelectItem value="suspicious">Suspicious Queue</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.category} onValueChange={(value) => setFilters((prev) => ({ ...prev, category: value === 'all' ? '' : value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value === 'all' ? '' : value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
              </SelectContent>
            </Select>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-4">
          {isLoading ? (
            [...Array(5)].map((_, index) => (
              <div key={index} className="h-32 rounded-2xl bg-white border border-gray-100 animate-pulse" />
            ))
          ) : products.length ? (
            <>
              {products.map((product) => {
                const status = getStatusLabel(product);

                return (
                  <article
                    key={product._id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-fade-in"
                  >
                    <div className="flex flex-col lg:flex-row gap-6">
                      <img
                        src={product.images?.[0] || PRODUCT_FALLBACK_IMAGE}
                        alt={product.title}
                        className="w-full lg:w-40 h-40 object-cover rounded-2xl bg-gray-100"
                        onError={setFallbackImage}
                      />
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-3 flex-wrap">
                              <h2 className="text-2xl font-bold text-gray-900">{product.title}</h2>
                              <Badge className={status.tone}>
                                {status.label}
                              </Badge>
                              {product.flagged && (
                                <Badge variant="destructive" className="bg-red-600">
                                  Flagged
                                </Badge>
                              )}
                              {product.riskScore > 0 && (
                                <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50">
                                  Risk Score: {product.riskScore}
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-600 mt-2">
                              {product.category} | {product.location}
                            </p>
                            <p className="text-gray-500 mt-1 text-sm">
                              Owner: {product.seller?.name || 'Unknown'} ({product.seller?.email || 'No email'})
                            </p>
                          </div>
                          <div className="text-left md:text-right">
                            <p className="text-2xl font-bold text-gray-900">{formatPrice(product.price)}</p>
                            <p className="text-sm text-gray-500 mt-1">{product.views || 0} views</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 mt-6">
                          <Button
                            variant={product.isActive ? 'outline' : 'primary'}
                            size="sm"
                            onClick={() =>
                              updateProductMutation.mutate({
                                productId: product._id,
                                payload: { isActive: !product.isActive },
                              })
                            }
                            disabled={updateProductMutation.isPending}
                          >
                            {product.isActive ? 'Deactivate Listing' : 'Activate Listing'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              updateProductMutation.mutate({
                                productId: product._id,
                                payload: { isSold: !product.isSold },
                              })
                            }
                            disabled={updateProductMutation.isPending}
                          >
                            {product.isSold ? 'Mark Unsold' : 'Mark Sold'}
                          </Button>
                          <Link to={`/products/${product._id}`}>
                            <Button variant="ghost" size="sm">View Listing</Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => deleteProductMutation.mutate(product._id)}
                            disabled={deleteProductMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
              
              {hasNextPage && (
                <div className="py-6 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="min-w-[200px]"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Loading...
                      </>
                    ) : (
                      'Load More Products'
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-500">
              No products matched these filters.
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AdminProductsPage;
