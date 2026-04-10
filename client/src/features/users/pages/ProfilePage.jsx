import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Edit, Save, X, ShieldCheck, LogOut, GraduationCap, Building2, CheckCircle2, BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { PageShell } from '../../../components/layout/PageShell';
import { Avatar } from '../../../components/ui/Avatar';
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
  const [campusForm, setCampusForm] = useState({
    collegeName: user?.campus?.collegeName || '',
    department: user?.campus?.department || '',
    year: user?.campus?.year || '',
    enrollmentId: user?.campus?.enrollmentId || '',
    hostel: user?.campus?.hostel || '',
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCampusFormChange = (e) => {
    setCampusForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    try {
      await updateUserProfile(user.id, { ...formData, campus: campusForm });
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
    setCampusForm({
      collegeName: user?.campus?.collegeName || '',
      department: user?.campus?.department || '',
      year: user?.campus?.year || '',
      enrollmentId: user?.campus?.enrollmentId || '',
      hostel: user?.campus?.hostel || '',
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

  return (
    <PageShell maxWidth="max-w-3xl">
      <div className="px-4 sm:px-6 py-6 md:py-12">

        {/* Profile Hero */}
        <div className="relative overflow-hidden rounded-4xl mb-6 bg-slate-900 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)]">
          <div className="absolute inset-0 bg-linear-to-br from-primary-900 via-indigo-900 to-blue-950 opacity-90" />
          <div className="absolute top-0 right-0 w-60 h-60 rounded-full bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-cyan-400/20 via-transparent to-transparent blur-3xl" />
          <div className="relative z-10 p-5 md:p-8 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 md:gap-6">
            <Avatar 
              src={user.avatar} 
              fallback={user.name} 
              size="2xl" 
              className="border-4 border-white/20 shadow-xl" 
            />
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
                {user.isVerified ? (
                  <Badge className="text-xs font-bold px-3 py-1 border-0 bg-emerald-500/20 text-emerald-200 backdrop-blur-sm">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Campus Verified
                  </Badge>
                ) : (
                  <Badge className="text-xs font-bold px-3 py-1 border-0 bg-amber-500/20 text-amber-200 backdrop-blur-sm">
                    Unverified
                  </Badge>
                )}
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">{user.name}</h1>
              <p className="text-primary-200/70 text-sm mt-0.5">{user.email}</p>
              {user.campus?.collegeName && (
                <p className="text-white/50 text-xs mt-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {user.campus.collegeName}
                  {user.campus.department && ` · ${user.campus.department}`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Edit Card */}
        <Card className="rounded-4xl border border-gray-100 shadow-sm animate-fade-in">
          <CardContent className="p-5 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6 md:mb-8">
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
              ].map((item) => (
                <div key={item.name} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50/60 border border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0 mt-0.5">
                    <item.icon className="w-4.5 h-4.5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                      {item.label}
                    </label>
                    {isEditing ? (
                      <Input
                        type={item.type}
                        name={item.name}
                        value={item.value}
                        onChange={handleChange}
                        className="h-10"
                      />
                    ) : (
                      <p className="text-gray-900 font-semibold">{item.display}</p>
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
        {/* Campus Identity Card */}
        <Card className="rounded-4xl border border-gray-100 shadow-sm animate-fade-in mt-6">
          <CardContent className="p-5 md:p-8">

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tight">Campus Identity</h2>
                <p className="text-gray-500 text-sm">Your academic profile</p>
              </div>
            </div>

            {isEditing ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">College / University</label>
                  <Input name="collegeName" value={campusForm.collegeName} onChange={handleCampusFormChange} placeholder="e.g. Gauhati University" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Department</label>
                  <Input name="department" value={campusForm.department} onChange={handleCampusFormChange} placeholder="e.g. Computer Science" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Year</label>
                  <select name="year" value={campusForm.year} onChange={handleCampusFormChange}
                    className="w-full h-11 rounded-xl border border-gray-800 bg-white px-4 py-2 text-[15px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select Year</option>
                    <option value="1st">1st Year</option>
                    <option value="2nd">2nd Year</option>
                    <option value="3rd">3rd Year</option>
                    <option value="4th">4th Year</option>
                    <option value="5th">5th Year</option>
                    <option value="Alumni">Alumni</option>
                    <option value="Faculty">Faculty</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Enrollment ID</label>
                  <Input name="enrollmentId" value={campusForm.enrollmentId} onChange={handleCampusFormChange} placeholder="e.g. GU2023CS042" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Hostel</label>
                  <Input name="hostel" value={campusForm.hostel} onChange={handleCampusFormChange} placeholder="e.g. PG Boys Hostel" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'College', value: user.campus?.collegeName, icon: Building2 },
                  { label: 'Department', value: user.campus?.department, icon: GraduationCap },
                  { label: 'Year', value: user.campus?.year, icon: BadgeCheck },
                  { label: 'Enrollment ID', value: user.campus?.enrollmentId, icon: ShieldCheck },
                  { label: 'Hostel', value: user.campus?.hostel, icon: MapPin },
                ].map((field) => (
                  <div key={field.label} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/60 border border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5">
                      <field.icon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400">{field.label}</p>
                      <p className="text-gray-900 font-semibold text-sm mt-0.5">{field.value || 'Not provided'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </PageShell>
  );
};

export default ProfilePage;
