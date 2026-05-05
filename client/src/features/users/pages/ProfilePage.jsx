import React, { useRef, useState, useEffect } from 'react';
import { User, Mail, MapPin, Edit, Save, X, ShieldCheck, LogOut, GraduationCap, Building2, CheckCircle2, BadgeCheck, AlertCircle, Star, Award, Smartphone, Trash2, Shield, Camera, Loader2, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageShell } from '../../../components/layout/PageShell';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../../components/ui/AlertDialog';
import { Card, CardContent } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { getUserProfile, getMyReputation, getMySellerVerification, requestSellerVerification, getMyDevices, removeDevice, trustDevice, uploadUserAvatar, getProfileCompletion } from '../api/userApi';
import { parseApiError, formatErrorForDisplay } from '../../../lib/errorHandler';

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
  const { user: authUser, logout, updateProfile } = useAuth();
  const queryClient = useQueryClient();
  const avatarInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [showTradingInfo, setShowTradingInfo] = useState(false);

  const { data: profileData, isLoading, refetch } = useQuery({
    queryKey: ['profile', authUser?.id],
    queryFn: () => getUserProfile(authUser.id),
    enabled: !!authUser?.id,
  });

  const { data: completionData, refetch: refetchCompletion } = useQuery({
    queryKey: ['profile-completion'],
    queryFn: getProfileCompletion,
    enabled: !!authUser?.id,
  });

  const { data: reputationData } = useQuery({
    queryKey: ['my-reputation'],
    queryFn: getMyReputation,
    enabled: !!authUser?.id,
  });

  const { data: verificationData } = useQuery({
    queryKey: ['my-seller-verification'],
    queryFn: getMySellerVerification,
    enabled: !!authUser?.id,
  });

  const { data: devicesData } = useQuery({
    queryKey: ['my-devices'],
    queryFn: getMyDevices,
    enabled: !!authUser?.id,
  });

  const verificationMutation = useMutation({
    mutationFn: requestSellerVerification,
    onSuccess: () => {
      toast.success('Verification request submitted');
      queryClient.invalidateQueries({ queryKey: ['my-seller-verification'] });
    },
    onError: (err) => {
      const parsedError = parseApiError(err, 'Failed to submit request');
      toast.error(formatErrorForDisplay(parsedError));
    },
  });

  const removeDeviceMutation = useMutation({
    mutationFn: removeDevice,
    onSuccess: () => {
      toast.success('Device removed');
      queryClient.invalidateQueries({ queryKey: ['my-devices'] });
    },
    onError: (err) => {
      const parsedError = parseApiError(err, 'Failed to remove device');
      toast.error(formatErrorForDisplay(parsedError));
    },
  });

  const trustDeviceMutation = useMutation({
    mutationFn: trustDevice,
    onSuccess: () => {
      toast.success('Device marked as trusted');
      queryClient.invalidateQueries({ queryKey: ['my-devices'] });
    },
  });

  const profile = profileData?.user || authUser;
  const trustSignals = profileData?.trustSignals;

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5MB'); return; }

    setAvatarUploading(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      await uploadUserAvatar(profile.id || profile._id, fd);
      toast.success('Profile photo updated!');
      refetch();
      refetchCompletion();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile-completion'] });
    } catch (err) {
      const parsedError = parseApiError(err, 'Failed to upload photo');
      toast.error(formatErrorForDisplay(parsedError));
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    location: '',
    profileRole: '',
    avatar: '',
  });
  const [campusForm, setCampusForm] = useState({
    department: '',
    course: '',
    year: '',
    semester: '',
    hostel: '',
    residentType: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        location: profile.location || '',
        profileRole: profile.profileRole || '',
        avatar: profile.avatar || '',
      });
      setCampusForm({
        department: profile.campus?.department || '',
        course: profile.campus?.course || '',
        year: profile.campus?.year || '',
        semester: profile.campus?.semester || '',
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
      await updateProfile({ ...formData, campus: campusForm });
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      refetch();
      refetchCompletion();
      queryClient.invalidateQueries({ queryKey: ['profile-completion'] });
    } catch (err) {
      const parsedError = parseApiError(err, 'Failed to update profile.');
      toast.error(formatErrorForDisplay(parsedError));
    }
  };
  const handleCancel = () => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        location: profile.location || '',
        profileRole: profile.profileRole || '',
        avatar: profile.avatar || '',
      });
      setCampusForm({
        department: profile.campus?.department || '',
        course: profile.campus?.course || '',
        year: profile.campus?.year || '',
        semester: profile.campus?.semester || '',
        hostel: profile.campus?.hostel || '',
        residentType: profile.campus?.residentType || '',
      });
    }
    setIsEditing(false);
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
            {/* Clickable avatar with upload overlay */}
            <div className="relative group shrink-0">
              <Avatar
                src={profile.avatar}
                fallback={profile.name}
                size="2xl"
                className="border-4 border-white/20 shadow-xl"
              />
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                title="Change profile photo"
              >
                {avatarUploading
                  ? <Loader2 className="w-6 h-6 text-white animate-spin" />
                  : <Camera className="w-6 h-6 text-white" />
                }
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              {/* Camera badge */}
              <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white flex items-center justify-center shadow-md border border-gray-100 pointer-events-none">
                <Camera className="w-3.5 h-3.5 text-primary-600" />
              </div>
            </div>
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
              {profile.campus?.department && (
                <p className="text-white/50 text-xs mt-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {profile.campus.department}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Profile Completion & Trading Eligibility */}
        {completionData && (
          <Card className="rounded-4xl border border-indigo-100 shadow-sm mb-6 bg-indigo-50/30">
            <CardContent className="p-5 md:p-6">

              {/* Header row */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-indigo-600" />
                    Profile Completion
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowTradingInfo(!showTradingInfo)}
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full hover:bg-indigo-100 text-indigo-400 hover:text-indigo-600 transition-colors"
                    title="Trading Eligibility Info"
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {/* Trading status badge */}
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    completionData.canTrade
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-rose-100 text-rose-600'
                  }`}>
                    {completionData.canTrade
                      ? <><CheckCircle2 className="w-3 h-3" /> Trading Enabled</>
                      : <><AlertCircle className="w-3 h-3" /> Trading Locked</>
                    }
                  </span>
                  <span className="text-sm font-bold text-indigo-600">{completionData.score}%</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-indigo-100 rounded-full h-2 mb-4 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${completionData.score}%` }}
                ></div>
              </div>

              {/* Eligibility detail panel */}
              {showTradingInfo && (
                <div className="p-4 rounded-2xl bg-white border border-indigo-100 shadow-xs mb-4">
                  <p className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-1">How Trading Eligibility Works</p>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    Both buyers and sellers must have a 100% complete profile with all required fields filled in.
                  </p>

                  {/* Required fields checklist */}
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Required Fields</p>
                  <div className="space-y-1.5 mb-4">
                    {[
                      { label: 'Email Verified', key: 'Email verification' },
                      { label: 'Full Name', key: 'Full name' },
                      { label: 'Profile Photo', key: 'Profile photo' },
                      { label: 'Department', key: 'Department' },
                      { label: 'Course', key: 'Course' },
                      { label: 'Campus Role', key: 'Campus role' },
                      { label: 'Year / Study Level', key: 'Year / study level' },
                      { label: 'Resident Type', key: 'Resident type' },
                      { label: 'Campus Meetup Location', key: 'Preferred campus meetup area' },
                    ].map((field, idx) => {
                      const isDone = !completionData.missing?.includes(field.key);
                      return (
                        <div key={idx} className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl ${
                          isDone ? 'bg-emerald-50/60' : 'bg-rose-50/60'
                        }`}>
                          <span className={isDone ? 'text-slate-600' : 'text-rose-700 font-medium'}>{field.label}</span>
                          {isDone
                            ? <><span className="text-[10px] font-bold text-emerald-600 mr-1">Done</span><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /></>
                            : <><span className="text-[10px] font-bold text-rose-500 mr-1">Missing</span><X className="w-3.5 h-3.5 text-rose-400" /></>
                          }
                        </div>
                      );
                    })}
                  </div>

                  {/* Overall status */}
                  {completionData.canTrade ? (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <p className="text-xs text-emerald-700 font-medium">You are eligible to buy and sell on CampusMitra.</p>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-100">
                      <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-rose-700">
                        Complete the <span className="font-bold">{completionData.missing?.length ?? 0} missing field{completionData.missing?.length !== 1 ? 's' : ''}</span> below to unlock buying and selling.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Low score warning */}
              {completionData.score < 60 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-3 text-amber-800 text-sm">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p>Your profile completion is low. Complete the fields below to unlock trading features.</p>
                </div>
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

            {/* Email is pre-verified via OTP during registration */}

            <div className="pt-6 mt-6 border-t border-gray-100">
              <Button
                onClick={() => setIsLogoutDialogOpen(true)}
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Hostel Name (if Hosteler)</label>
                  <Input name="hostel" value={campusForm.hostel} onChange={handleCampusFormChange} placeholder="e.g. PG Boys Hostel" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Department', value: profile.campus?.department, icon: GraduationCap },
                  { label: 'Course', value: profile.campus?.course, icon: GraduationCap },
                  { label: 'Year & Sem', value: [profile.campus?.year, profile.campus?.semester].filter(Boolean).join(' - '), icon: BadgeCheck },
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

        {/* Reputation Card */}
        {reputationData && (
          <Card className="rounded-4xl border border-gray-100 shadow-sm animate-fade-in mt-6">
            <CardContent className="p-5 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                  <Star className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">Reputation</h2>
                  <p className="text-gray-500 text-sm">Your seller performance metrics</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                {[
                  { label: 'Score', value: `${reputationData.score}/100` },
                  { label: 'Completion Rate', value: `${reputationData.completionRate}%` },
                  { label: 'Avg Rating', value: `${reputationData.averageRating} ★` },
                  { label: 'Total Orders', value: reputationData.totalOrders },
                ].map((m) => (
                  <div key={m.label} className="bg-gray-50 rounded-2xl p-4 text-center">
                    <p className="text-2xl font-black text-gray-900">{m.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{m.label}</p>
                  </div>
                ))}
              </div>
              {reputationData.trustLabels?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {reputationData.trustLabels.map((label) => (
                    <span key={label} className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                      {label}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Seller Verification Card */}
        <Card className="rounded-4xl border border-gray-100 shadow-sm animate-fade-in mt-6">
          <CardContent className="p-5 md:p-8">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Award className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">Seller Verification</h2>
                  <p className="text-gray-500 text-sm">Get a verified badge to build buyer trust</p>
                </div>
              </div>
              {verificationData?.sellerVerificationStatus === 'verified' && (
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Verified ✓</Badge>
              )}
              {verificationData?.sellerVerificationStatus === 'pending' && (
                <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending Review</Badge>
              )}
              {verificationData?.sellerVerificationStatus === 'rejected' && (
                <Badge className="bg-red-100 text-red-700 border-red-200">Rejected</Badge>
              )}
            </div>
            {(!verificationData?.sellerVerificationStatus || verificationData?.sellerVerificationStatus === 'none' || verificationData?.sellerVerificationStatus === 'rejected') && (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Requirements: email verified, 5+ completed orders, 4.0+ rating, 80%+ completion rate.
                </p>
                {verificationData?.sellerVerificationStatus === 'rejected' && verificationData?.sellerVerificationReason && (
                  <p className="text-sm text-red-600 mb-3">Rejection reason: {verificationData.sellerVerificationReason}</p>
                )}
                <Button
                  onClick={() => verificationMutation.mutate()}
                  disabled={verificationMutation.isPending}
                  className="rounded-full gap-2"
                >
                  <Shield className="w-4 h-4" />
                  Request Verification
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Devices Card */}
        {devicesData?.devices?.length > 0 && (
          <Card className="rounded-4xl border border-gray-100 shadow-sm animate-fade-in mt-6">
            <CardContent className="p-5 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">Active Devices</h2>
                  <p className="text-gray-500 text-sm">Devices currently logged into your account</p>
                </div>
              </div>
              <div className="space-y-3">
                {devicesData.devices.map((device) => (
                  <div key={device._id} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-4 h-4 text-gray-500 shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-gray-900">{device.deviceName}</p>
                        <p className="text-xs text-gray-500">{device.browser} · {device.os} · {device.lastIpAddress}</p>
                        <p className="text-xs text-gray-400">Last used: {new Date(device.lastUsedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {device.isTrusted && (
                        <span className="text-xs text-emerald-600 font-semibold">Trusted</span>
                      )}
                      {!device.isTrusted && (
                        <Button size="sm" variant="outline" onClick={() => trustDeviceMutation.mutate(device._id)} className="text-xs rounded-xl">
                          Trust
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => removeDeviceMutation.mutate(device._id)} className="text-red-500 border-red-200 hover:bg-red-50 rounded-xl">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent className="rounded-3xl border-gray-100 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-gray-900">Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              Are you sure you want to sign out? You will need to login again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="rounded-xl border-gray-200 font-semibold hover:bg-gray-50">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                logout();
                setIsLogoutDialogOpen(false);
              }}
              className="rounded-xl bg-red-600 font-semibold text-white hover:bg-red-700 border-none shadow-lg shadow-red-200"
            >
              Logout
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
};

export default ProfilePage;
