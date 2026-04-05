import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Edit, Save, X, ShieldCheck, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import Header from '../../../components/Header';
import Footer from '../../../components/Footer';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { updateUserProfile } from '../api/userApi';

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    try {
      await updateUserProfile(user.id, formData);
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      window.location.reload();
    } catch {
      toast.error('Failed to update profile.');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: user?.location || '',
    });
    setIsEditing(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f7f4ec_0%,#f8fafc_24%,#f8fafc_100%)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Please log in to view your profile</h1>
        </div>
      </div>
    );
  }

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f4ec_0%,#f8fafc_24%,#f8fafc_100%)]">
      <Header />
      <div className="max-w-3xl mx-auto px-4 py-12">

        {/* Profile Hero */}
        <div className="relative overflow-hidden rounded-4xl mb-6 bg-slate-900 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)]">
          <div className="absolute inset-0 bg-linear-to-br from-primary-900 via-indigo-900 to-blue-950 opacity-90" />
          <div className="absolute top-0 right-0 w-60 h-60 rounded-full bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-cyan-400/20 via-transparent to-transparent blur-3xl" />
          <div className="relative z-10 p-8 flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-primary-400/30 to-indigo-400/20 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white text-3xl font-black shrink-0 shadow-xl">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  className={`text-xs font-bold px-3 py-1 border-0 ${
                    user.role === 'admin'
                      ? 'bg-rose-500/20 text-rose-200 backdrop-blur-sm'
                      : 'bg-white/10 text-white/80 backdrop-blur-sm'
                  }`}
                >
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  {user.role}
                </Badge>
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">{user.name}</h1>
              <p className="text-primary-200/70 text-sm mt-0.5">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Edit Card */}
        <Card className="rounded-4xl border border-gray-100 shadow-sm animate-fade-in">
          <CardContent className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Account Details</h2>
                <p className="text-gray-500 text-sm mt-1">Manage your personal information</p>
              </div>
              {!isEditing ? (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  className="gap-2 rounded-full"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSave} className="gap-2 rounded-full">
                    <Save className="w-4 h-4" />
                    Save
                  </Button>
                  <Button onClick={handleCancel} variant="outline" className="gap-2 rounded-full">
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-5">
              {[
                {
                  icon: User,
                  label: 'Full Name',
                  name: 'name',
                  value: formData.name,
                  display: user.name,
                  type: 'text',
                },
                {
                  icon: Mail,
                  label: 'Email Address',
                  name: 'email',
                  value: formData.email,
                  display: user.email,
                  type: 'email',
                },
                {
                  icon: Phone,
                  label: 'Phone Number',
                  name: 'phone',
                  value: formData.phone,
                  display: user.phone || 'Not provided',
                  type: 'tel',
                },
                {
                  icon: MapPin,
                  label: 'Location',
                  name: 'location',
                  value: formData.location,
                  display: user.location || 'Not provided',
                  type: 'text',
                },
              ].map(({ icon: Icon, label, name, value, display, type }) => (
                <div key={name} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50/60 border border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-4.5 h-4.5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      {label}
                    </label>
                    {isEditing ? (
                      <Input
                        type={type}
                        name={name}
                        value={value}
                        onChange={handleChange}
                        className="h-10"
                      />
                    ) : (
                      <p className="text-gray-900 font-semibold">{display}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-6 mt-6 border-t border-gray-100">
              <Button
                onClick={logout}
                variant="outline"
                className="gap-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 rounded-full"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default ProfilePage;
