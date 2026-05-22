import React from 'react';
import { 
  User, Mail, MapPin, Edit, Save, X, ShieldCheck, LogOut, 
  Smartphone, Trash2, Camera, Loader2, LayoutDashboard, Settings
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import { Card, CardContent } from '../../../../components/ui/Card';
import { Input } from '../../../../components/ui/Input';
import { Avatar } from '../../../../components/ui/Avatar';
import { PROFILE_FIELD_LABELS } from '../../../../lib/profileForm';

const AdminProfileView = ({
  profile,
  isEditing,
  editError,
  onEnterEdit,
  formData,
  handleChange,
  handleSave,
  handleCancel,
  handleAvatarChange,
  avatarUploading,
  avatarInputRef,
  onPhotoClick,
  setIsLogoutDialogOpen,
}) => {
  return (
    <div className="animate-fade-in">
      {/* Admin Hero */}
      <div className="relative overflow-hidden rounded-4xl mb-6 bg-slate-900 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)]">
        <div className="absolute inset-0 bg-linear-to-br from-rose-900 via-slate-900 to-black opacity-90" />
        <div className="absolute top-0 right-0 w-60 h-60 rounded-full bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-rose-400/10 via-transparent to-transparent blur-3xl" />
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
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              <Badge className="text-xs font-bold px-3 py-1 border-0 bg-rose-500 text-white shadow-lg shadow-rose-500/20">
                <ShieldCheck className="w-3 h-3 mr-1" />
                SYSTEM ADMINISTRATOR
              </Badge>
              <Badge className="text-xs font-bold px-3 py-1 border-0 bg-white/10 text-white/80 backdrop-blur-sm">
                Full Access
              </Badge>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">{profile.name}</h1>
            <p className="text-rose-200/70 text-sm mt-0.5">{profile.email}</p>
            
            <div className="mt-6 flex flex-wrap justify-center sm:justify-start gap-3">
              <Link to="/admin-dashboard">
                <Button className="bg-white text-slate-900 hover:bg-rose-50 rounded-full gap-2 border-0">
                  <LayoutDashboard className="w-4 h-4" />
                  Admin Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-4xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-gray-500" />
                <h3 className="font-bold text-gray-900">Account Settings</h3>
              </div>
              {!isEditing ? (
                <Button onClick={onEnterEdit} variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700 font-bold gap-1">
                  <Edit className="w-3.5 h-3.5" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleSave} size="sm" className="rounded-xl h-8">Save</Button>
                  <Button onClick={handleCancel} variant="outline" size="sm" className="rounded-xl h-8">Cancel</Button>
                </div>
              )}
            </div>
            <CardContent className="p-6">
              {isEditing && editError && (
                <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm font-medium text-red-600 whitespace-pre-line">{editError}</p>
                </div>
              )}
              <div className="space-y-4">
                {!isEditing && (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                      {PROFILE_FIELD_LABELS.email.label}
                    </label>
                    <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50/50 border border-transparent">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-semibold text-gray-700">{profile.email}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 ml-1">{PROFILE_FIELD_LABELS.email.hint}</p>
                  </div>
                )}

                {[
                  { icon: User, label: 'Display Name', name: 'name', value: formData.name, display: profile.name, placeholder: PROFILE_FIELD_LABELS.name.placeholder },
                  { icon: MapPin, label: PROFILE_FIELD_LABELS.location.label, name: 'location', value: formData.location, display: profile.location || 'Not set', placeholder: PROFILE_FIELD_LABELS.location.placeholder },
                ].map((item) => (
                  <div key={item.name} className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                      {item.label}
                    </label>
                    {isEditing ? (
                      <Input
                        name={item.name}
                        value={item.value}
                        onChange={handleChange}
                        placeholder={item.placeholder}
                        className="rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white transition-all"
                      />
                    ) : (
                      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-gray-50/50 border border-transparent">
                        <item.icon className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700">{item.display}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-gray-50 flex justify-between items-center">
                <p className="text-xs text-gray-400 italic">Logs are recorded for all administrative changes.</p>
                <Button 
                  onClick={() => setIsLogoutDialogOpen(true)} 
                  variant="outline" 
                  className="rounded-full text-red-500 border-red-100 hover:bg-red-50 gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security & Devices */}
        <div className="space-y-6">
          <Card className="rounded-4xl border border-gray-100 shadow-sm overflow-hidden h-full">
             <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-gray-500" />
                  Security
                </h3>
             </div>
             <CardContent className="p-6">
                <div className="rounded-3xl bg-indigo-50/50 p-4 border border-indigo-50">
                  <div className="flex gap-3">
                    <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-indigo-900">Security Tip</p>
                      <p className="text-[11px] text-indigo-700/70 mt-0.5 leading-relaxed">
                        Session logs are audited daily. Always sign out from shared or public devices. Manage your active sessions from the Settings menu.
                      </p>
                    </div>
                  </div>
                </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminProfileView;
