import React, { useRef, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Camera, Trash2, X } from 'lucide-react';
import { PageShell } from '../../../components/layout/PageShell';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../components/ui/Dialog';
import { getUserProfile, getMyReputation, getMySellerVerification, requestSellerVerification, uploadUserAvatar, getProfileCompletion } from '../api/userApi';
import { parseApiError, formatErrorForDisplay } from '../../../lib/errorHandler';
import { Button } from '@/components/ui/Button';

// Modular Profile Views
import UserProfileView from '../components/profile/UserProfileView';
import AdminProfileView from '../components/profile/AdminProfileView';
import ProfileSkeleton from '../components/profile/ProfileSkeleton';

const ProfilePage = () => {
  const { user: authUser, logout, updateProfile } = useAuth();
  const queryClient = useQueryClient();
  const avatarInputRef = useRef(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [isPhotoDialogOpen, setIsPhotoDialogOpen] = useState(false);
  const [showFullPhoto, setShowFullPhoto] = useState(false);
  const [showTradingInfo] = useState(false);

  const { data: profileData, isLoading, refetch } = useQuery({
    queryKey: ['profile', authUser?.id],
    queryFn: () => getUserProfile(authUser.id),
    enabled: !!authUser?.id,
  });

  const { data: completionData, refetch: refetchCompletion } = useQuery({
    queryKey: ['profile-completion'],
    queryFn: getProfileCompletion,
    enabled: !!authUser?.id && authUser?.role !== 'admin', // Don't fetch for admin
  });

  const { data: reputationData } = useQuery({
    queryKey: ['my-reputation'],
    queryFn: getMyReputation,
    enabled: !!authUser?.id && authUser?.role !== 'admin',
  });

  const { data: verificationData } = useQuery({
    queryKey: ['my-seller-verification'],
    queryFn: getMySellerVerification,
    enabled: !!authUser?.id && authUser?.role !== 'admin',
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
      if (authUser?.role !== 'admin') refetchCompletion();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile-completion'] });
    } catch (err) {
      const parsedError = parseApiError(err, 'Failed to upload photo');
      toast.error(formatErrorForDisplay(parsedError));
    } finally {
      setAvatarUploading(false);
      setIsPhotoDialogOpen(false);
      if (avatarInputRef.current) avatarInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      setAvatarUploading(true);
      await updateProfile({ avatar: '' });
      toast.success('Profile photo removed');
      refetch();
      if (authUser?.role !== 'admin') refetchCompletion();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['profile-completion'] });
    } catch (err) {
      const parsedError = parseApiError(err, 'Failed to remove photo');
      toast.error(formatErrorForDisplay(parsedError));
    } finally {
      setAvatarUploading(false);
      setIsPhotoDialogOpen(false);
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



  const handleSave = async () => {
    try {
      await updateProfile({ ...formData, campus: campusForm });
      toast.success('Profile updated successfully!');
      setIsEditing(false);
      refetch();
      if (authUser?.role !== 'admin') refetchCompletion();
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Please log in to view your profile</h1>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <PageShell maxWidth="max-w-6xl">
        <div className="px-4 sm:px-6 py-6 md:py-12">
          <ProfileSkeleton />
        </div>
      </PageShell>
    );
  }

  const commonProps = {
    profile,

    isEditing,
    setIsEditing,
    formData,
    handleChange,
    handleSave,
    handleCancel,
    handleAvatarChange,
    avatarUploading,
    avatarInputRef,
    setIsLogoutDialogOpen,

  };

  return (
    <PageShell maxWidth="max-w-6xl">
      <div className="px-4 sm:px-6 py-6 md:py-12">
        {profile.role === 'admin' ? (
          <AdminProfileView {...commonProps} />
        ) : (
          <UserProfileView
            {...commonProps}
            trustSignals={trustSignals}
            completionData={completionData}
            reputationData={reputationData}
            verificationData={verificationData}
            handleCancel={handleCancel}
            handleAvatarChange={handleAvatarChange}
            avatarUploading={avatarUploading}
            avatarInputRef={avatarInputRef}
            onPhotoClick={() => setIsPhotoDialogOpen(true)}
            showTradingInfo={showTradingInfo}
            verificationMutation={verificationMutation}
          />
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

      {/* Photo Management Dialog */}
      <Dialog open={isPhotoDialogOpen} onOpenChange={setIsPhotoDialogOpen}>
        <DialogContent className="sm:max-w-md p-6 rounded-3xl z-50" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Profile Photo</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            {profile.avatar && (
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 h-12 rounded-2xl border-gray-200"
                onClick={() => {
                  setShowFullPhoto(true);
                  setIsPhotoDialogOpen(false);
                }}
              >
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <Eye className="w-4 h-4" />
                </div>
                <span className="font-semibold">View Photo</span>
              </Button>
            )}
            
            <Button 
              variant="outline" 
              className="w-full justify-start gap-3 h-12 rounded-2xl border-gray-200"
              onClick={() => avatarInputRef.current?.click()}
              disabled={avatarUploading}
            >
              <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <Camera className="w-4 h-4" />
              </div>
              <span className="font-semibold">{profile.avatar ? 'Change Photo' : 'Upload Photo'}</span>
            </Button>

            {profile.avatar && (
              <Button 
                variant="outline" 
                className="w-full justify-start gap-3 h-12 rounded-2xl border-red-100 text-red-600 hover:bg-red-50"
                onClick={handleRemoveAvatar}
                disabled={avatarUploading}
              >
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                  <Trash2 className="w-4 h-4" />
                </div>
                <span className="font-semibold">Remove Photo</span>
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Full Photo Viewer */}
      <Dialog open={showFullPhoto} onOpenChange={setShowFullPhoto}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-black/90 border-0 rounded-4xl z-50" aria-describedby={undefined}>
          <DialogTitle className="sr-only">Full Photo Viewer</DialogTitle>
          <div className="relative aspect-square w-full max-h-[80vh] flex items-center justify-center p-4">
            <img 
              src={profile.avatar} 
              alt={profile.name} 
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            />
            <button 
              onClick={() => setShowFullPhoto(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
};

export default ProfilePage;
