import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Flag, ShieldCheck } from 'lucide-react';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { Badge } from '../../../components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/Card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../components/ui/Select';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import { getAdminReports, updateAdminReport } from '../api/adminApi';

const statusTone = {
  open: 'bg-red-50 text-red-700',
  reviewed: 'bg-amber-50 text-amber-700',
  resolved: 'bg-emerald-50 text-emerald-700',
  dismissed: 'bg-gray-100 text-gray-700',
};

const AdminReportsPage = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    status: '',
    targetType: '',
  });
  const [notesByReport, setNotesByReport] = useState({});

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      }
    });
    return params.toString();
  }, [filters]);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', queryString],
    queryFn: () => getAdminReports(queryString),
  });

  const updateMutation = useMutation({
    mutationFn: ({ reportId, payload }) => updateAdminReport(reportId, payload),
    onSuccess: (response) => {
      toast.success(response.message || 'Report updated');
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || error.message || 'Failed to update report');
    },
  });

  const reports = data?.reports || [];

  const handleStatusChange = (reportId, status) => {
    updateMutation.mutate({
      reportId,
      payload: {
        status,
        adminNotes: notesByReport[reportId] || '',
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-red-600">Admin Tools</p>
              <h1 className="text-4xl font-bold text-gray-900 mt-2">Reports & Moderation</h1>
              <p className="text-gray-600 mt-3 max-w-2xl">
                Review user-submitted reports, investigate flagged listings or owners, and track moderation outcomes.
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select value={filters.status || 'all'} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value === 'all' ? '' : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="dismissed">Dismissed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filters.targetType || 'all'} onValueChange={(value) => setFilters((prev) => ({ ...prev, targetType: value === 'all' ? '' : value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All targets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All targets</SelectItem>
                  <SelectItem value="product">Product reports</SelectItem>
                  <SelectItem value="user">User reports</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <section className="space-y-5">
          {isLoading ? (
            [...Array(4)].map((_, index) => (
              <div key={index} className="h-56 rounded-3xl border border-gray-100 bg-white animate-pulse" />
            ))
          ) : reports.length ? (
            reports.map((report) => (
              <Card key={report._id} className="rounded-3xl border-gray-100 shadow-sm animate-fade-in">
                <CardHeader className="border-b border-gray-100 pb-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Flag className="h-5 w-5 text-red-600" />
                        {report.targetType === 'product' ? 'Product Report' : 'User Report'}
                      </CardTitle>
                      <p className="mt-2 text-sm text-gray-500">
                        Reported on {new Date(report.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    <Badge className={`${statusTone[report.status] || statusTone.open} border-transparent px-3 py-1`}>
                      {report.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5 p-6">
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Reporter</p>
                      <p className="mt-2 font-semibold text-gray-900">{report.reporter?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{report.reporter?.email || 'No email'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Reported Owner</p>
                      <p className="mt-2 font-semibold text-gray-900">{report.reportedUser?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{report.reportedUser?.email || 'No email'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Listing</p>
                      <p className="mt-2 font-semibold text-gray-900">{report.product?.title || 'Listing unavailable'}</p>
                      <p className="text-sm text-gray-500">{report.product?.category || 'No category'}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-4">
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Reason</p>
                    <p className="mt-2 text-gray-900 font-medium">{report.reason}</p>
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                      {report.details || 'No additional details provided.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr_160px]">
                    <Select value={report.status} onValueChange={(value) => handleStatusChange(report._id, value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="dismissed">Dismissed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Textarea
                      value={notesByReport[report._id] ?? report.adminNotes ?? ''}
                      onChange={(event) => setNotesByReport((prev) => ({ ...prev, [report._id]: event.target.value }))}
                      placeholder="Add admin notes for this report"
                      className="min-h-[88px] bg-white"
                    />
                    <Button
                      className="h-fit self-start"
                      onClick={() => updateMutation.mutate({
                        reportId: report._id,
                        payload: {
                          status: report.status,
                          adminNotes: notesByReport[report._id] ?? report.adminNotes ?? '',
                        },
                      })}
                      disabled={updateMutation.isPending}
                    >
                      Save Notes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="rounded-3xl border-gray-100 shadow-sm">
              <CardContent className="p-10 text-center text-gray-500">
                No reports matched these filters.
              </CardContent>
            </Card>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default AdminReportsPage;
