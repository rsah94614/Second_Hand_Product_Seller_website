import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ShieldCheck, Search, UserCog } from 'lucide-react';
import Header from '../../../components/shared/Header';
import Footer from '../../../components/shared/Footer';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { getAdminUsers, updateAdminUser } from '../api/adminApi';

const AdminUsersPage = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: '',
    role: '',
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
    queryKey: ['admin-users', queryString],
    queryFn: () => getAdminUsers(queryString),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ userId, payload }) => updateAdminUser(userId, payload),
    onSuccess: (response) => {
      toast.success(response.message || 'User updated');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to update user');
    },
  });

  const users = data?.users || [];

  const handleRoleChange = (userId, role) => {
    updateUserMutation.mutate({ userId, payload: { role } });
  };

  const toggleUserActive = (user) => {
    updateUserMutation.mutate({
      userId: user._id,
      payload: { isActive: !(user.isActive !== false) },
    });
  };

  const toggleVerified = (user) => {
    updateUserMutation.mutate({
      userId: user._id,
      payload: { isVerified: !user.isVerified },
    });
  };

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
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-red-600">
                Admin Tools
              </p>
              <h1 className="text-4xl font-bold text-gray-900 mt-2">User Management</h1>
              <p className="text-gray-600 mt-3 max-w-2xl">
                Control roles, account status, and verification so the marketplace stays safe and organized.
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
                placeholder="Search by name, email, or location"
                className="pl-10"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <select
              value={filters.role}
              onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">All Roles</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </section>

        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
            <UserCog className="w-5 h-5 text-red-600" />
            <h2 className="text-xl font-bold text-gray-900">Users</h2>
          </div>

          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : users.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">User</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Role</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Verified</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">Joined</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((user) => {
                    const isActive = user.isActive !== false;

                    return (
                      <tr key={user._id} className="hover:bg-gray-50/80">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <p className="text-sm text-gray-500">{user.location || 'No location set'}</p>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user._id, e.target.value)}
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            user.isVerified ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {user.isVerified ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleVerified(user)}
                              disabled={updateUserMutation.isPending}
                            >
                              {user.isVerified ? 'Unverify' : 'Verify'}
                            </Button>
                            <Button
                              variant={isActive ? 'outline' : 'primary'}
                              size="sm"
                              onClick={() => toggleUserActive(user)}
                              disabled={updateUserMutation.isPending}
                            >
                              {isActive ? 'Deactivate' : 'Activate'}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-gray-500">No users matched these filters.</div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AdminUsersPage;
