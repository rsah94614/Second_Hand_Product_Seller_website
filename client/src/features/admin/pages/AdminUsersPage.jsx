import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ShieldCheck, Search, UserCog } from 'lucide-react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/Select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/Table';
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
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-8 animate-fade-in">
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

        <Card className="rounded-3xl border-gray-100 shadow-sm mb-8 animate-fade-up-delayed">
          <CardContent className="p-6">
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
            <Select value={filters.role} onValueChange={(value) => setFilters((prev) => ({ ...prev, role: value === 'all' ? '' : value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
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
              </SelectContent>
            </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-gray-100 shadow-sm overflow-hidden animate-fade-up-delayed">
          <CardHeader className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <UserCog className="w-5 h-5 text-red-600" />
              <CardTitle className="text-xl">Users</CardTitle>
            </div>
          </CardHeader>

          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="h-16 rounded-2xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : users.length ? (
            <Table className="min-w-full">
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">User</TableHead>
                  <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Role</TableHead>
                  <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Status</TableHead>
                  <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Verified</TableHead>
                  <TableHead className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">Joined</TableHead>
                  <TableHead className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                  {users.map((user) => {
                    const isActive = user.isActive !== false;

                    return (
                      <TableRow key={user._id} className="hover:bg-gray-50/80">
                        <TableCell className="px-6 py-4">
                          <p className="font-semibold text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <p className="text-sm text-gray-500">{user.location || 'No location set'}</p>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Select value={user.role} onValueChange={(value) => handleRoleChange(user._id, value)}>
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge variant={isActive ? 'success' : 'secondary'}>
                            {isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <Badge variant={user.isVerified ? 'default' : 'outline'} className={user.isVerified ? '' : 'border-amber-200 text-amber-700'}>
                            {user.isVerified ? 'Verified' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-sm text-gray-500">{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="px-6 py-4">
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
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          ) : (
            <div className="p-10 text-center text-gray-500">No users matched these filters.</div>
          )}
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default AdminUsersPage;
