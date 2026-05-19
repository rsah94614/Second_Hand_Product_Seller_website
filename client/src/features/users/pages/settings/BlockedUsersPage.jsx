import React, { useState, useEffect } from 'react';
import { ShieldAlert, UserX, Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getBlockedUsers, unblockUser } from '../../api/userApi';
import toast from 'react-hot-toast';
import Header from '../../../../components/Header';
import Footer from '../../../../components/Footer';



const BlockedUsersPage = () => {
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState(null);


  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      const data = await getBlockedUsers();
      setBlockedUsers(data || []);
    } catch {
      toast.error('Failed to load blocked users');

    } finally {
      setLoading(false);
    }
  };

  const handleUnblock = async (userId) => {
    setUnblockingId(userId);
    try {
      await unblockUser(userId);
      toast.success('User unblocked successfully');

      setBlockedUsers(blockedUsers.filter(user => user._id !== userId));
    } catch {
      toast.error('Failed to unblock user');

    } finally {
      setUnblockingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading blocked users...</p>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="min-h-screen bg-gray-50/50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <Link to="/settings" className="inline-flex items-center gap-2 text-indigo-600 font-bold mb-6 hover:gap-3 transition-all">
            <ArrowLeft className="w-4 h-4" /> Back to Settings
          </Link>

          <div className="bg-white rounded-4xl border border-gray-100 shadow-xl p-8">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-red-50 rounded-2xl">
                <ShieldAlert className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900">Blocked Users</h1>
                <p className="text-gray-500 font-medium text-sm">Users you block will appear here. They cannot message you or see your listings.</p>
              </div>
            </div>

            {blockedUsers.length === 0 ? (
              <div className="text-center py-12 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                <UserX className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-900 font-bold text-lg">No blocked users</p>
                <p className="text-gray-500 text-sm mt-1">Your block list is empty.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {blockedUsers.map((user) => (
                  <div key={user._id} className="flex items-center justify-between p-4 bg-gray-50/80 rounded-2xl border border-gray-100 group hover:border-indigo-100 hover:bg-white transition-all duration-300">
                    <div className="flex items-center gap-4">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                      ) : (
                        <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm shadow-indigo-100">
                          {user.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500 font-medium">{user.role || 'User'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleUnblock(user._id)}
                      disabled={unblockingId === user._id}
                      className="px-6 py-2 bg-white border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:border-red-500 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-50"
                    >
                      {unblockingId === user._id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : 'Unblock'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );

};

export default BlockedUsersPage;
