import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Search, ShieldCheck, Trash2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { API_BASE_URL } from '../config/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { DEFAULT_PRODUCT_CATEGORIES } from '../config/productOptions';

const AdminProducts = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: '',
    category: '',
    status: '',
  });

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    params.set('limit', '50');
    return params.toString();
  }, [filters]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', queryString],
    queryFn: () =>
      axios.get(`${API_BASE_URL}/api/admin/products?${queryString}`).then((res) => res.data),
  });

  const { data: categoryResponse } = useQuery({
    queryKey: ['product-categories'],
    queryFn: () => axios.get(`${API_BASE_URL}/api/categories`).then((res) => res.data),
  });

  const categories = categoryResponse?.categories?.map((category) => category.name) || DEFAULT_PRODUCT_CATEGORIES;

  const updateProductMutation = useMutation({
    mutationFn: ({ productId, payload }) =>
      axios.patch(`${API_BASE_URL}/api/admin/products/${productId}`, payload),
    onSuccess: (response) => {
      toast.success(response.data.message || 'Product updated');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update product');
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (productId) => axios.delete(`${API_BASE_URL}/api/admin/products/${productId}`),
    onSuccess: (response) => {
      toast.success(response.data.message || 'Product deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    },
  });

  const products = data?.products || [];

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
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-8">
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

        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Input
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                placeholder="Search title, location, or description"
                className="pl-10"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <select
              value={filters.category}
              onChange={(e) => setFilters((prev) => ({ ...prev, category: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="sold">Sold</option>
            </select>
          </div>
        </section>

        <section className="space-y-4">
          {isLoading ? (
            [...Array(5)].map((_, index) => (
              <div key={index} className="h-32 rounded-3xl bg-white border border-gray-100 animate-pulse" />
            ))
          ) : products.length ? (
            products.map((product) => {
              const status = getStatusLabel(product);

              return (
                <article
                  key={product._id}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    <img
                      src={product.images?.[0] || 'https://via.placeholder.com/160?text=Product'}
                      alt={product.title}
                      className="w-full lg:w-40 h-40 object-cover rounded-2xl bg-gray-100"
                    />
                    <div className="flex-1">
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3 flex-wrap">
                            <h2 className="text-2xl font-bold text-gray-900">{product.title}</h2>
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${status.tone}`}>
                              {status.label}
                            </span>
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
            })
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center text-gray-500">
              No products matched these filters.
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AdminProducts;
