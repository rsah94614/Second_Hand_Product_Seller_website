import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDisputes, resolveDispute, rejectDispute } from '../../orders/api/orderApi';
import { Search, Filter, MessageSquare, AlertTriangle, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import toast from 'react-hot-toast';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';

export default function AdminDisputesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolutionText, setResolutionText] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const queryClient = useQueryClient();

  const { data: disputes = [], isLoading } = useQuery({
    queryKey: ['admin-disputes'],
    queryFn: getDisputes,
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, payload }) => resolveDispute(id, payload),
    onSuccess: () => {
      toast.success('Dispute resolved successfully');
      queryClient.invalidateQueries(['admin-disputes']);
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to resolve dispute');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, payload }) => rejectDispute(id, payload),
    onSuccess: () => {
      toast.success('Dispute rejected successfully');
      queryClient.invalidateQueries(['admin-disputes']);
      closeModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reject dispute');
    },
  });

  const filteredDisputes = disputes.filter(dispute => {
    const matchesSearch = dispute.order?._id?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          dispute.initiatedBy?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openModal = (dispute) => {
    setSelectedDispute(dispute);
    setResolutionText('');
    setAdminNotes('');
  };

  const closeModal = () => {
    setSelectedDispute(null);
    setResolutionText('');
    setAdminNotes('');
  };

  const handleResolve = () => {
    if (!adminNotes.trim()) {
      toast.error('Admin Notes are required.');
      return;
    }
    if (!resolutionText.trim()) {
      toast.error('Resolution detail is required.');
      return;
    }
    resolveMutation.mutate({
      id: selectedDispute._id,
      payload: { resolution: resolutionText, adminNotes }
    });
  };

  const handleReject = () => {
    if (!adminNotes.trim()) {
      toast.error('Admin Notes are required.');
      return;
    }
    if (!resolutionText.trim()) {
      toast.error('Reason is required.');
      return;
    }
    rejectMutation.mutate({
      id: selectedDispute._id,
      payload: { reason: resolutionText, adminNotes }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="p-8 text-center text-slate-500">Loading disputes...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mb-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-red-600">
                Admin Tools
              </p>
              <h1 className="text-4xl font-bold text-gray-900 mt-2 flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
                Dispute Management
              </h1>
              <p className="text-gray-600 mt-3 max-w-2xl">
                Review and resolve user-raised disputes. Provide fair judgments on conflicts between buyers and sellers.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-red-50 text-red-700 px-4 py-2 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              Admin Only
            </div>
          </div>
        </section>

      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by Order ID or User..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg text-sm py-2 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Statuses</option>
              <option value="open">Open</option>
              <option value="under_review">Under Review</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-medium border-b border-gray-100">
              <tr>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Initiated By</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredDisputes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                    No disputes found.
                  </td>
                </tr>
              ) : (
                filteredDisputes.map((dispute) => (
                  <tr key={dispute._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      #{dispute.order?._id?.slice(-6) || 'Unknown'}
                    </td>
                    <td className="px-6 py-4">
                      {dispute.initiatedBy?.name || 'Unknown User'}
                    </td>
                    <td className="px-6 py-4 capitalize">
                      {dispute.reason?.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
                        dispute.status === 'resolved' ? 'bg-emerald-100 text-emerald-700' :
                        dispute.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {dispute.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openModal(dispute)}
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 font-bold"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Review
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">Review Dispute</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-500">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Order</p>
                  <p className="font-bold text-gray-900">#{selectedDispute.order?._id}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Initiated By</p>
                  <p className="font-bold text-gray-900">{selectedDispute.initiatedBy?.name}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Reason</p>
                  <p className="font-bold text-gray-900 capitalize">{selectedDispute.reason?.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Status</p>
                  <p className="font-bold capitalize text-gray-900">{selectedDispute.status}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-500 text-sm mb-2 font-bold uppercase tracking-wider">Description</p>
                <div className="bg-gray-50 p-4 rounded-xl text-sm text-gray-700 border border-gray-100">
                  {selectedDispute.description || 'No description provided.'}
                </div>
              </div>

              {selectedDispute.evidence && selectedDispute.evidence.length > 0 && (
                <div>
                  <p className="text-gray-500 text-sm mb-2 font-bold uppercase tracking-wider">Evidence</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {selectedDispute.evidence.map((url, i) => (
                      <img key={i} src={url} alt={`Evidence ${i+1}`} className="h-24 w-24 object-cover rounded-lg border border-gray-200" />
                    ))}
                  </div>
                </div>
              )}

              {(selectedDispute.status === 'open' || selectedDispute.status === 'under_review') && (
                <div className="space-y-4 pt-6 border-t border-gray-100">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Admin Notes (Required)</label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Internal notes about the dispute investigation..."
                      className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Resolution / Rejection Reason (Required)</label>
                    <textarea
                      value={resolutionText}
                      onChange={(e) => setResolutionText(e.target.value)}
                      placeholder="Explanation that will be shown to the user..."
                      className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-red-500 outline-none"
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>

            {(selectedDispute.status === 'open' || selectedDispute.status === 'under_review') ? (
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50/50">
                <Button variant="outline" onClick={closeModal}>Cancel</Button>
                <Button 
                  onClick={handleReject}
                  loading={rejectMutation.isPending}
                  disabled={resolveMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Reject Dispute
                </Button>
                <Button 
                  onClick={handleResolve}
                  loading={resolveMutation.isPending}
                  disabled={rejectMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Resolve for User
                </Button>
              </div>
            ) : (
              <div className="p-6 border-t border-gray-100 flex justify-end bg-gray-50/50">
                <Button variant="outline" onClick={closeModal}>Close</Button>
              </div>
            )}
          </div>
        </div>
      )}
      </main>
      <Footer />
    </div>
  );
}
