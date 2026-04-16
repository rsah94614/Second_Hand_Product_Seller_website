import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Edit, Save, X, ShieldCheck, LogOut, GraduationCap, Building2, CheckCircle2, BadgeCheck, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { PageShell } from '../../../components/layout/PageShell';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { updateUserProfile, getUserProfile } from '../api/userApi';

const getTrustLabelColor = (colorStr) => {
  const map = {
    green: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    blue: 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    gray: 'bg-gray-500/20 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800',
    emerald: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    amber: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    purple: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
  };
  return map[colorStr] || map.gray;
};

const ProfilePage = () => {
  const { user: authUser, logout, sendPhoneVerificationOtp, confirmPhoneVerificationOtp } = useAuth();

  const { data: profileData, isLoading, refetch } = useQuery({
    queryKey: ['profile', authUser?.id],
    queryFn: () => getUserProfile(authUser.id),
    enabled: !!authUser?.id,
  });

  const profile = profileData?.user || authUser;
  const trustSignals = profileData?.trustSignals;

  const [isEditing, setIsEditing] = useState(false);
  const [verificationOtp, setVerificationOtp] = useState('');
  const [verificationPending, setVerificationPending] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    location: '',
    profileRole: '',
    avatar: '',
  });
  const [campusForm, setCampusForm] = useState({
    collegeName: '',
    department: '',
    course: '',
    year: '',
    semester: '',
    enrollmentId: '',
    hostel: '',
    residentType: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        location: profile.location || '',
        profileRole: profile.profileRole || '',
        avatar: profile.avatar || '',
      });
      setCampusForm({
        collegeName: profile.campus?.collegeName || '',
        department: profile.campus?.department || '',
        course: profile.campus?.course || '',
        year: profile.campus?.year || '',
        semester: profile.campus?.semester || '',
        enrollmentId: profile.campus?.enrollmentId || '',
        hostel: profile.campus?.hostel || '',
        residentType: profile.campus?.residentType || '',
      });
    }
  }, [profile]);


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
      await updateUserProfile(profile.id || profile._id, { ...formData, campus: campusForm });
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      refetch();
    } catch {
      toast.error('Failed to update profile.');
    }
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        location: profile.location || '',
        profileRole: profile.profileRole || '',
        avatar: profile.avatar || '',
      });
      setCampusForm({
        collegeName: profile.campus?.collegeName || '',
        department: profile.campus?.department || '',
        course: profile.campus?.course || '',
        year: profile.campus?.year || '',
        semester: profile.campus?.semester || '',
        enrollmentId: profile.campus?.enrollmentId || '',
        hostel: profile.campus?.hostel || '',
        residentType: profile.campus?.residentType || '',
      });
    }
    setIsEditing(false);
  };

  const handleSendVerificationOtp = async () => {
    const result = await sendPhoneVerificationOtp();
    if (result.success) {
      setVerificationPending(true);
      toast.success(result.otpDebugCode ? `OTP sent. Demo code: ${result.otpDebugCode}` : result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleVerifyPhone = async () => {
    if (!verificationOtp.trim()) {
      toast.error('Enter the OTP first');
      return;
    }

    const result = await confirmPhoneVerificationOtp(verificationOtp);
    if (result.success) {
      setVerificationOtp('');
      setVerificationPending(false);
      toast.success(result.message);
      refetch();
    } else {
      toast.error(result.message);
    }
  };

  if (!authUser) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f7f4ec_0%,#f8fafc_24%,#f8fafc_100%)] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Please log in to view your profile</h1>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <PageShell maxWidth="max-w-6xl">
      <div className="px-4 sm:px-6 py-6 md:py-12">

        {/* Profile Hero */}
        <div className="relative overflow-hidden rounded-4xl mb-6 bg-slate-900 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)]">
          <div className="absolute inset-0 bg-linear-to-br from-primary-900 via-indigo-900 to-blue-950 opacity-90" />
          <div className="absolute top-0 right-0 w-60 h-60 rounded-full bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-cyan-400/20 via-transparent to-transparent blur-3xl" />
          <div className="relative z-10 p-5 md:p-8 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 md:gap-6">
            <Avatar
              src={profile.avatar}
              fallback={profile.name}
              size="2xl"
              className="border-4 border-white/20 shadow-xl"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge
                  className={`text-xs font-bold px-3 py-1 border-0 ${profile.role === 'admin'
                      ? 'bg-rose-500/20 text-rose-200 backdrop-blur-sm'
                      : 'bg-white/10 text-white/80 backdrop-blur-sm'
                    }`}
                >
                  <ShieldCheck className="w-3 h-3 mr-1" />
                  {profile.role}
                </Badge>
                {profile.isVerified && (
                  <Badge className="text-xs font-bold px-3 py-1 border-0 bg-emerald-500/20 text-emerald-200 backdrop-blur-sm">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Campus Verified
                  </Badge>
                )}
                {trustSignals?.trustLabels?.map(label => (
                  <Badge key={label.key} className={`border outline-hidden whitespace-nowrap px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase backdrop-blur-md bg-white/10 ${getTrustLabelColor(label.color)}`}>
                    {label.label}
                  </Badge>
                ))}
              </div>
              <h1 className="text-3xl font-black text-white tracking-tight">{profile.name}</h1>
              <p className="text-primary-200/70 text-sm mt-0.5">{profile.email}</p>
              {profile.campus?.collegeName && (
                <p className="text-white/50 text-xs mt-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {profile.campus.collegeName}
                  {profile.campus.department && ` · ${profile.campus.department}`}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Profile Completion Bar */}
        {trustSignals?.profileCompletionScore !== undefined && trustSignals.profileCompletionScore < 100 && (
          <Card className="rounded-4xl border border-indigo-100 shadow-sm mb-6 bg-indigo-50/30">
            <CardContent className="p-5 md:p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-indigo-600" />
                  Profile Completion
                </h3>
                <span className="text-sm font-bold text-indigo-600">{trustSignals.profileCompletionScore}%</span>
              </div>
              <div className="w-full bg-indigo-100 rounded-full h-2 mb-4 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${trustSignals.profileCompletionScore}%` }}
                ></div>
              </div>
              {trustSignals.profileCompletionScore < 60 || !profile.phoneVerified ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-3 text-amber-800 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>Your profile is not ready for campus trading yet. Verify your phone and complete the campus fields below to create listings or start new chats.</p>
                </div>
              ) : (
                <p className="text-xs text-indigo-600/70 font-medium">Complete your profile to unlock the 'Profile Complete' badge and build trust with buyers.</p>
              )}
            </CardContent>
          </Card>
        )}

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
                  display: profile.name,
                  type: 'text',
                },
                {
                  icon: Mail,
                  label: 'Email Address',
                  name: 'email',
                  value: formData.email,
                  display: profile.email,
                  type: 'email',
                },
                {
                  icon: Phone,
                  label: 'Phone Number',
                  name: 'phone',
                  value: formData.phone,
                  display: profile.phone || 'Not provided',
                  type: 'tel',
                },
                {
                  icon: User,
                  label: 'Profile Image URL',
                  name: 'avatar',
                  value: formData.avatar,
                  display: formData.avatar ? 'Image URL provided' : 'No image',
                  type: 'text',
                },
                {
                  icon: MapPin,
                  label: 'Location',
                  name: 'location',
                  value: formData.location,
                  display: profile.location || 'Not provided',
                  type: 'text',
                },
                {
                  icon: User,
                  label: 'Campus Role',
                  name: 'profileRole',
                  value: formData.profileRole,
                  display: profile.profileRole || 'Not provided',
                  type: 'select',
                  options: [
                    { value: '', label: 'Select Role' },
                    { value: 'student', label: 'Student' },
                    { value: 'staff', label: 'Staff' },
                    { value: 'alumni', label: 'Alumni' },
                  ]
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
                      item.type === 'select' ? (
                        <select
                          name={item.name}
                          value={item.value}
                          onChange={handleChange}
                          className="w-full h-10 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-hidden focus:ring-2 focus:ring-primary-500/20"
                        >
                          {item.options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          type={item.type}
                          name={item.name}
                          value={item.value}
                          onChange={handleChange}
                          className="h-10"
                        />
                      )
                    ) : (
                      <p className="text-gray-900 font-semibold">{item.display}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {!profile.phoneVerified && (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-bold text-amber-900">Phone verification is required for trading</p>
                    <p className="mt-1 text-xs text-amber-700">
                      Verify your number to unlock listing creation and new campus chats.
                    </p>
                  </div>
                  <Button type="button" variant="outline" className="rounded-full border-amber-300 text-amber-800 hover:bg-amber-100" onClick={handleSendVerificationOtp}>
                    Send OTP
                  </Button>
                </div>
                {verificationPending && (
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <Input
                      value={verificationOtp}
                      onChange={(e) => setVerificationOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP"
                      className="sm:max-w-xs"
                    />
                    <Button type="button" className="rounded-full" onClick={handleVerifyPhone}>
                      Verify Phone
                    </Button>
                  </div>
                )}
              </div>
            )}

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
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Course</label>
                  <Input name="course" value={campusForm.course} onChange={handleCampusFormChange} placeholder="e.g. B.Tech" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Semester</label>
                  <Input name="semester" value={campusForm.semester} onChange={handleCampusFormChange} placeholder="e.g. 5th Semester" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Year</label>
                  <select name="year" value={campusForm.year} onChange={handleCampusFormChange}
                    className="w-full h-11 rounded-xl border border-gray-200 bg-white px-4 py-2 text-[15px] text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Resident Type</label>
                  <select name="residentType" value={campusForm.residentType} onChange={handleCampusFormChange}
                    className="w-full h-11 rounded-xl border border-gray-200 bg-white px-4 py-2 text-[15px] text-gray-700 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20"
                  >
                    <option value="">Select Target Audience/Type</option>
                    <option value="hosteler">Hosteler</option>
                    <option value="day_scholar">Day Scholar</option>
                    <option value="faculty">Faculty Quarter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Enrollment ID</label>
                  <Input name="enrollmentId" value={campusForm.enrollmentId} onChange={handleCampusFormChange} placeholder="e.g. GU2023CS042" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Hostel Name (if Hosteler)</label>
                  <Input name="hostel" value={campusForm.hostel} onChange={handleCampusFormChange} placeholder="e.g. PG Boys Hostel" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'College', value: profile.campus?.collegeName, icon: Building2 },
                  { label: 'Department', value: profile.campus?.department, icon: GraduationCap },
                  { label: 'Course', value: profile.campus?.course, icon: GraduationCap },
                  { label: 'Year & Sem', value: [profile.campus?.year, profile.campus?.semester].filter(Boolean).join(' - '), icon: BadgeCheck },
                  { label: 'Enrollment ID', value: profile.campus?.enrollmentId, icon: ShieldCheck },
                  { label: 'Resident Type', value: profile.campus?.residentType?.replace('_', ' '), icon: Building2 },
                  { label: 'Hostel', value: profile.campus?.hostel, icon: MapPin },
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
