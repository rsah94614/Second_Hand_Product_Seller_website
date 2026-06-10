import React, { useMemo, useState } from 'react';
import { useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ShieldCheck, Search, UserCog, Loader2, CheckSquare, Square } from 'lucide-react';
import AdminHeader from '../../../components/AdminHeader';
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
import { getAdminUsers, updateAdminUser, getAdminSuspiciousUsers, suspendUser, bulkSuspendUsers } from '../api/adminApi';

const AdminUsersPage = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    viewMode: 'all',
  });
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchUsers = async ({ pageParam = null }) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && key !== 'viewMode') params.set(key, value);
    });
    if (pageParam) params.set('cursor', pageParam);
    params.set('limit', '50');

    if (filters.viewMode === 'suspicious') {
      return getAdminSuspiciousUsers(params.toString());
    }
    return getAdminUsers(params.toString());
  };

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteQuery({
    queryKey: ['admin-users', filters],
    queryFn: fetchUsers,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
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

  const suspendUserMutation = useMutation({
    mutationFn: ({ userId, reason }) => suspendUser(userId, { suspensionReason: reason }),
    onSuccess: (response) => {
      toast.success(response.message || 'User suspended');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to suspend user');
    },
  });

  const bulkSuspendMutation = useMutation({
    mutationFn: (payload) => bulkSuspendUsers(payload),
    onSuccess: (response) => {
      toast.success(response.message || 'Bulk action completed');
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Bulk action failed'),
  });

  const handleBulkSuspend = (suspended) => {
    if (selectedIds.length === 0) return;
    const reason = suspended ? window.prompt('Reason for suspension (optional):') || '' : '';
    bulkSuspendMutation.mutate({ userIds: selectedIds, suspended, reason });
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const users = useMemo(() => {
    const raw = data?.pages.flatMap((page) => page.users) || [];
    const seen = new Set();
    return raw.filter((u) => {
      if (!u?._id || seen.has(u._id)) return false;
      seen.add(u._id);
      return true;
    });
  }, [data]);

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

  const handleSuspend = (user) => {
    const reason = window.prompt(`Enter suspension reason for ${user.name}:`);
    if (reason) {
      suspendUserMutation.mutate({ userId: user._id, reason });
    }
  };

  const formatDate = (value) =>
    new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8 animate-fade-in">
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

        <Card className="rounded-2xl border-gray-100 shadow-sm mb-8 animate-fade-up-delayed">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Input
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                placeholder="Search..."
                className="pl-10"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
            <Select value={filters.viewMode} onValueChange={(value) => setFilters((prev) => ({ ...prev, viewMode: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="suspicious">Suspicious Queue</SelectItem>
              </SelectContent>
            </Select>
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

        <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden animate-fade-up-delayed">
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
            <>
              {/* Bulk action bar */}
              {selectedIds.length > 0 && (
                <div className="flex items-center gap-3 px-6 py-3 bg-primary-50 border-b border-primary-100">
                  <span className="text-sm font-semibold text-primary-700">{selectedIds.length} selected</span>
                  <Button size="sm" variant="outline" onClick={() => handleBulkSuspend(true)} disabled={bulkSuspendMutation.isPending} className="text-red-600 border-red-200 hover:bg-red-50 hover:cursor-pointer">
                    Suspend All
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => handleBulkSuspend(false)} disabled={bulkSuspendMutation.isPending} className="hover:cursor-pointer">
                    Unsuspend All
                  </Button>
                  <button onClick={() => setSelectedIds([])} className="ml-auto text-xs text-gray-500 hover:text-gray-700 hover:cursor-pointer">Clear</button>
                </div>
              )}
              <Table className="min-w-full">
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead className="px-4 py-4 w-10" />
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
                        <TableRow key={user._id} className={`hover:bg-gray-50/80 ${selectedIds.includes(user._id) ? 'bg-primary-50/30' : ''}`}>
                          <TableCell className="px-4 py-4">
                            <button onClick={() => toggleSelect(user._id)} className="text-gray-400 hover:cursor-pointer">
                              {selectedIds.includes(user._id) ? <CheckSquare className="w-4 h-4 text-primary-600" /> : <Square className="w-4 h-4" />}
                            </button>
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <p className="font-semibold text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                            <p className="text-sm text-gray-500">{user.location || 'No location set'}</p>
                            {user.riskScore > 0 && (
                              <p className="text-xs font-bold text-red-600 mt-1">Risk Score: {user.riskScore}</p>
                            )}
                          </TableCell>
                          <TableCell className="px-6 py-4">
                            <Select value={user.role} onValueChange={(value) => handleRoleChange(user._id, value)}>
                              <SelectTrigger className="w-[140px] hover:cursor-pointer">
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
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSuspend(user)}
                                disabled={suspendUserMutation.isPending || user.isSuspended}
                                className="text-red-600 hover:bg-red-50 hover:border-red-200 hover:cursor-pointer"
                              >
                                {user.isSuspended ? 'Suspended' : 'Suspend'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
              
              {hasNextPage && (
                <div className="p-6 flex justify-center border-t border-gray-100">
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
                      'Load More Users'
                    )}
                  </Button>
                </div>
              )}
            </>
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
