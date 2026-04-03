import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FolderTree, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import Header from '../../../components/shared/Header';
import Footer from '../../../components/shared/Footer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import {
  createAdminCategory,
  deleteAdminCategory,
  getAdminCategories,
  updateAdminCategory,
} from '../api/adminApi';

const emptyForm = {
  name: '',
  description: '',
  sortOrder: 0,
  isActive: true,
};

class AdminCategoriesErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error) {
    console.error('AdminCategories render error:', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-gray-50">
          <Header />
          <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="bg-white rounded-3xl border border-red-100 shadow-sm p-8">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-red-600">
                Admin Categories Error
              </p>
              <h1 className="text-3xl font-bold text-gray-900 mt-3">This page failed to render</h1>
              <p className="text-gray-600 mt-3">
                A runtime error happened before the category data could load.
              </p>
              <pre className="mt-6 rounded-2xl bg-gray-950 text-red-200 p-4 overflow-x-auto text-sm whitespace-pre-wrap">
                {this.state.error?.message || 'Unknown render error'}
              </pre>
            </div>
          </main>
          <Footer />
        </div>
      );
    }

    return this.props.children;
  }
}

const AdminCategoriesContent = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: getAdminCategories,
  });

  const saveCategoryMutation = useMutation({
    mutationFn: (payload) => {
      if (editingId) {
        return updateAdminCategory(editingId, payload);
      }

      return createAdminCategory(payload);
    },
    onSuccess: (response) => {
      toast.success(response.message || 'Category saved');
      setFormData(emptyForm);
      setEditingId('');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
    onError: (mutationError) => {
      toast.error(mutationError.response?.data?.message || mutationError.message || 'Failed to save category');
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId) => deleteAdminCategory(categoryId),
    onSuccess: (response) => {
      toast.success(response.message || 'Category deleted');
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
    onError: (mutationError) => {
      toast.error(mutationError.response?.data?.message || mutationError.message || 'Failed to delete category');
    },
  });

  const categories = useMemo(() => data?.categories || [], [data]);

  const handleSubmit = (e) => {
    e.preventDefault();
    saveCategoryMutation.mutate({
      ...formData,
      sortOrder: Number(formData.sortOrder) || 0,
    });
  };

  const startEditing = (category) => {
    setEditingId(category._id);
    setFormData({
      name: category.name,
      description: category.description || '',
      sortOrder: category.sortOrder || 0,
      isActive: category.isActive !== false,
    });
  };

  const resetForm = () => {
    setEditingId('');
    setFormData(emptyForm);
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
              <h1 className="text-4xl font-bold text-gray-900 mt-2">Category Management</h1>
              <p className="text-gray-600 mt-3 max-w-2xl">
                Shape the catalog structure that users see when they create listings and browse the marketplace.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 text-red-700 px-4 py-2 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              Admin Only
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-1 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 h-fit">
            <div className="flex items-center gap-3 mb-6">
              <Plus className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-bold text-gray-900">
                {editingId ? 'Edit Category' : 'Create Category'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Category name"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="flex min-h-[100px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                  placeholder="Short category description"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Sort Order</label>
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData((prev) => ({ ...prev, sortOrder: e.target.value }))}
                />
              </div>
              <label className="flex items-center gap-3 text-sm font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
                />
                Keep category active
              </label>
              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={saveCategoryMutation.isPending}>
                  {editingId ? 'Update Category' : 'Create Category'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Reset
                </Button>
              </div>
            </form>
          </div>

          <div className="xl:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
              <FolderTree className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-bold text-gray-900">Catalog Categories</h2>
            </div>

            {error ? (
              <div className="p-6">
                <div className="rounded-2xl border border-red-100 bg-red-50 p-6">
                  <p className="text-sm font-medium uppercase tracking-wide text-red-700">
                    Category Request Failed
                  </p>
                  <p className="text-gray-800 mt-3">
                    The admin category API did not load successfully.
                  </p>
                  <pre className="mt-4 rounded-2xl bg-gray-950 text-red-200 p-4 overflow-x-auto text-sm whitespace-pre-wrap">
                    {error.response?.data?.message || error.message || 'Unknown API error'}
                  </pre>
                </div>
              </div>
            ) : isLoading ? (
              <div className="p-6 space-y-4">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : categories.length ? (
              <div className="divide-y divide-gray-100">
                {categories.map((category) => (
                  <div key={category._id} className="px-6 py-5 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                          category.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'
                        }`}>
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="inline-flex rounded-full px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-700">
                          {category.productCount || 0} products
                        </span>
                      </div>
                      <p className="text-gray-600 mt-2">{category.description || 'No description added yet.'}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => startEditing(category)}>
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-200 hover:bg-red-50"
                        onClick={() => deleteCategoryMutation.mutate(category._id)}
                        disabled={deleteCategoryMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-10 text-center text-gray-500">No categories found.</div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

const AdminCategoriesPage = () => (
  <AdminCategoriesErrorBoundary>
    <AdminCategoriesContent />
  </AdminCategoriesErrorBoundary>
);

export default AdminCategoriesPage;
