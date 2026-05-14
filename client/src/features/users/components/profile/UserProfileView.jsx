import React from 'react';
import {
  User, Mail, MapPin, Edit, Save, X, ShieldCheck, LogOut,
  GraduationCap, Building2, CheckCircle2, BadgeCheck,
  AlertCircle, Star, Award, Shield, Camera, Loader2, Info
} from 'lucide-react';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Card, CardContent } from '../../../../components/ui/Card';
import { Input } from '../../../../components/ui/Input';
import { Avatar } from '../../../../components/ui/Avatar';

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

const UserProfileView = ({
  profile,
  trustSignals,
  completionData,
  reputationData,
  verificationData,
  isEditing,

  setIsEditing,
  formData,
  campusForm,
  handleChange,
  handleCampusFormChange,
  handleSave,
  handleCancel,
  handleAvatarChange,
  avatarUploading,
  avatarInputRef,
  onPhotoClick,
  showTradingInfo,
  setShowTradingInfo,
  verificationMutation,
  setIsLogoutDialogOpen,
}) => {
  return (
    <div className="animate-fade-in">
      {/* Profile Hero */}
      <div className="relative overflow-hidden rounded-4xl mb-6 bg-slate-900 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)]">
        <div className="absolute inset-0 bg-linear-to-br from-primary-900 via-indigo-900 to-blue-950 opacity-90" />
        <div className="absolute top-0 right-0 w-60 h-60 rounded-full bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-cyan-400/20 via-transparent to-transparent blur-3xl" />
        <div className="relative z-10 p-5 md:p-8 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 md:gap-6">
          <div className="relative group shrink-0">
            <Avatar
              src={profile.avatar}
              fallback={profile.name}
              size="2xl"
              className="border-4 border-white/20 shadow-xl"
            />
            <button
              type="button"
              onClick={onPhotoClick}
              disabled={avatarUploading}
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            >
              {avatarUploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
            </button>
            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <div className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-white flex items-center justify-center shadow-md border border-gray-100">
              <Camera className="w-3.5 h-3.5 text-primary-600" />
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge className="text-xs font-bold px-3 py-1 border-0 bg-white/10 text-white/80 backdrop-blur-sm">
                <ShieldCheck className="w-3 h-3 mr-1" />
                User
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

      {/* Profile Completion */}
      {completionData && (
        <Card className="rounded-4xl border border-indigo-100 shadow-sm mb-6 bg-indigo-50/30">
          <CardContent className="p-5 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-indigo-600" />
                  Profile Completion
                </h3>
                <button type="button" onClick={() => setShowTradingInfo(!showTradingInfo)} className="text-indigo-400 hover:text-indigo-600 transition-colors">
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full ${completionData.canTrade ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-600'}`}>
                  {completionData.canTrade ? <><CheckCircle2 className="w-3 h-3" /> Trading Enabled</> : <><AlertCircle className="w-3 h-3" /> Trading Locked</>}
                </span>
                <span className="text-sm font-bold text-indigo-600">{completionData.score}%</span>
              </div>
            </div>
            <div className="w-full bg-indigo-100 rounded-full h-2 mb-4 overflow-hidden">
              <div className="bg-indigo-600 h-2 rounded-full transition-all duration-1000 ease-out" style={{ width: `${completionData.score}%` }}></div>
            </div>
            {showTradingInfo && (
              <div className="p-4 rounded-2xl bg-white border border-indigo-100 shadow-xs mb-4">
                <p className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-1">Trading unlocks at 60% completion</p>
                <p className="text-[10px] text-indigo-700/70 leading-tight mb-3">Complete the fields below to increase your score and unlock trading features.</p>
                <div className="space-y-1.5">
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
                      <div key={idx} className={`flex items-center justify-between text-xs px-3 py-2 rounded-xl ${isDone ? 'bg-emerald-50/60' : 'bg-rose-50/60'}`}>
                        <span className={isDone ? 'text-slate-600' : 'text-rose-700 font-medium'}>{field.label}</span>
                        {isDone ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <X className="w-3.5 h-3.5 text-rose-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Account Details */}
      <Card className="rounded-4xl border border-gray-100 shadow-sm mb-6">
        <CardContent className="p-5 md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Account Details</h2>
              <p className="text-gray-500 text-sm">Manage your personal information</p>
            </div>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline" className="rounded-full gap-2"><Edit className="w-4 h-4" /> Edit Profile</Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleSave} className="rounded-full gap-2"><Save className="w-4 h-4" /> Save</Button>
                <Button onClick={handleCancel} variant="outline" className="rounded-full gap-2"><X className="w-4 h-4" /> Cancel</Button>
              </div>
            )}
          </div>
          <div className="space-y-5">
            {[
              { icon: User, label: 'Full Name', name: 'name', value: formData.name, display: profile.name, type: 'text' },
              { icon: Mail, label: 'Email Address', name: 'email', value: formData.email, display: profile.email, type: 'email' },
              { icon: MapPin, label: 'Location', name: 'location', value: formData.location, display: profile.location || 'Not provided', type: 'text' },
              { icon: User, label: 'Campus Role', name: 'profileRole', value: formData.profileRole, display: profile.profileRole || 'Not provided', type: 'select', options: [{ value: '', label: 'Select Role' }, { value: 'student', label: 'Student' }, { value: 'staff', label: 'Staff' }, { value: 'alumni', label: 'Alumni' }] },
            ].map((item) => (
              <div key={item.name} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50/60 border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center shrink-0 mt-0.5"><item.icon className="w-4.5 h-4.5 text-primary-600" /></div>
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">{item.label}</label>
                  {isEditing ? (
                    item.type === 'select' ? (
                      <select name={item.name} value={item.value} onChange={handleChange} className="w-full h-10 rounded-xl border border-black bg-white px-3 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-primary-500/20">
                        {item.options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    ) : <Input type={item.type} name={item.name} value={item.value} onChange={handleChange} className="h-10" />
                  ) : <p className="text-gray-900 font-semibold">{item.display}</p>}
                </div>
              </div>
            ))}
          </div>
          <div className="pt-6 mt-6 border-t border-gray-100">
            <Button onClick={() => setIsLogoutDialogOpen(true)} variant="outline" className="gap-2 text-red-600 border-red-200 hover:bg-red-50 rounded-full"><LogOut className="w-4 h-4" /> Sign Out</Button>
          </div>
        </CardContent>
      </Card>

      {/* Campus Identity */}
      <Card className="rounded-4xl border border-gray-100 shadow-sm mb-6">
        <CardContent className="p-5 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-indigo-600" /></div>
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Campus Identity</h2>
              <p className="text-gray-500 text-sm">Your academic profile</p>
            </div>
          </div>
          {isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Department</label><Input name="department" value={campusForm.department} onChange={handleCampusFormChange} /></div>
              <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Course</label><Input name="course" value={campusForm.course} onChange={handleCampusFormChange} /></div>
              <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Semester</label><Input name="semester" value={campusForm.semester} onChange={handleCampusFormChange} /></div>
              <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Year</label><select name="year" value={campusForm.year} onChange={handleCampusFormChange} className="w-full h-11 rounded-xl border border-black bg-white px-4 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-primary-500/20"><option value="">Select Year</option><option value="1st">1st Year</option><option value="2nd">2nd Year</option><option value="3rd">3rd Year</option><option value="4th">4th Year</option><option value="5th">5th Year</option><option value="Alumni">Alumni</option><option value="Faculty">Faculty</option></select></div>
              <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Resident Type</label><select name="residentType" value={campusForm.residentType} onChange={handleCampusFormChange} className="w-full h-11 rounded-xl border border-black bg-white px-4 py-2 text-sm text-gray-700 focus:ring-2 focus:ring-primary-500/20"><option value="">Select Type</option><option value="hosteler">Hosteler</option><option value="day_scholar">Day Scholar</option><option value="faculty">Faculty Quarter</option></select></div>
              <div><label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">Hostel Name</label><Input name="hostel" value={campusForm.hostel} onChange={handleCampusFormChange} /></div>
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
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0 mt-0.5"><field.icon className="w-4 h-4 text-indigo-600" /></div>
                  <div><p className="text-xs font-bold uppercase tracking-wider text-gray-400">{field.label}</p><p className="text-gray-900 font-semibold text-sm mt-0.5">{field.value || 'Not provided'}</p></div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reputation */}
      {reputationData && (
        <Card className="rounded-4xl border border-gray-100 shadow-sm mb-6">
          <CardContent className="p-5 md:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><Star className="w-5 h-5 text-amber-500" /></div>
              <div><h2 className="text-xl font-black text-gray-900 tracking-tight">Reputation</h2><p className="text-gray-500 text-sm">Your seller performance metrics</p></div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              {[
                { label: 'Score', value: `${reputationData?.reputation?.score ?? 0}/100` },
                { label: 'Completion Rate', value: `${reputationData?.reputation?.completionRate ?? 0}%` },
                { label: 'Avg Rating', value: `${reputationData?.reputation?.averageRating ?? 0} ★` },
                { label: 'Total Orders', value: reputationData?.reputation?.totalOrders ?? 0 },
              ].map((m) => (

                <div key={m.label} className="bg-gray-50 rounded-2xl p-4 text-center"><p className="text-2xl font-black text-gray-900">{m.value}</p><p className="text-xs text-gray-500 mt-1">{m.label}</p></div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seller Verification */}
      <Card className="rounded-4xl border border-gray-100 shadow-sm mb-6">
        <CardContent className="p-5 md:p-8">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center"><Award className="w-5 h-5 text-indigo-600" /></div>
              <div><h2 className="text-xl font-black text-gray-900 tracking-tight">Seller Verification</h2><p className="text-gray-500 text-sm">Get a verified badge to build buyer trust</p></div>
            </div>
            {verificationData?.status === 'verified' && <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Verified ✓</Badge>}
            {verificationData?.status === 'pending' && <Badge className="bg-amber-100 text-amber-700 border-amber-200">Pending Review</Badge>}
            {verificationData?.status === 'rejected' && <Badge className="bg-red-100 text-red-700 border-red-200">Rejected</Badge>}
          </div>
          {(!verificationData?.status || verificationData?.status === 'none' || verificationData?.status === 'rejected') && (

            <div>
              <p className="text-sm text-gray-600 mb-4">Requirements: email verified, 5+ completed orders, 4.0+ rating, 80%+ completion rate.</p>
              <Button onClick={() => verificationMutation.mutate()} disabled={verificationMutation.isPending} className="rounded-full gap-2"><Shield className="w-4 h-4" /> Request Verification</Button>
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  );
};

export default UserProfileView;
