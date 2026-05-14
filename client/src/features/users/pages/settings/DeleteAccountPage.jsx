import React, { useState } from 'react';
import { Trash2, AlertTriangle, Loader2, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { deleteAccount } from '../../api/userApi';
import { useAuth } from '../../../../context/AuthContext';
import Header from '../../../../components/Header';
import Footer from '../../../../components/Footer';

import toast from 'react-hot-toast';


const DeleteAccountPage = () => {
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const { logout } = useAuth();

  const navigate = useNavigate();

  const handleDelete = async (e) => {
    e.preventDefault();
    if (confirmation !== 'DELETE') return;

    if (!window.confirm('Are you absolutely sure? This action is permanent and cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      await deleteAccount();
      toast.success('Your account has been successfully deleted');

      logout();
      navigate('/login');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to delete account';
      toast.error(message);

    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-50/50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Link to="/settings" className="inline-flex items-center gap-2 text-indigo-600 font-bold mb-6 hover:gap-3 transition-all">
            <ArrowLeft className="w-4 h-4" /> Back to Settings
          </Link>

          <div className="bg-white rounded-4xl border border-gray-100 shadow-xl p-8 overflow-hidden relative">
            {/* Danger Banner */}
            <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />

            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-red-50 rounded-2xl">
                <Trash2 className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900">Delete Account</h1>
                <p className="text-gray-500 font-medium text-sm">Permanently remove your account and all associated data.</p>
              </div>
            </div>

            <div className="bg-red-50/50 rounded-3xl p-6 border border-red-100 mb-8">
              <div className="flex gap-3 mb-4">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <p className="text-red-900 font-bold">Important Notice</p>
              </div>
              <ul className="space-y-3">
                {[
                  'Your profile and listings will be permanently removed.',
                  'Active chats and messages will be anonymized.',
                  'This action is irreversible.',
                  'Remaining order data will be kept for legal/tracking purposes but anonymized.'
                ].map((text, i) => (
                  <li key={i} className="flex gap-3 text-sm text-red-700/80 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            <form onSubmit={handleDelete} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Type <span className="text-red-500">DELETE</span> to confirm
                </label>
                <input
                  type="text"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value.toUpperCase())}
                  placeholder="Type DELETE"
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:ring-4 focus:ring-red-500/10 focus:border-red-500 transition-all font-bold text-lg text-center"
                />
              </div>

              <button
                type="submit"
                disabled={confirmation !== 'DELETE' || loading}
                className="w-full py-4 bg-red-600 text-white font-black rounded-2xl shadow-lg shadow-red-200 hover:bg-red-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                ) : 'Confirm Account Deletion'}
              </button>

              <Link
                to="/settings"
                className="block text-center text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
              >
                I changed my mind, take me back
              </Link>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default DeleteAccountPage;
