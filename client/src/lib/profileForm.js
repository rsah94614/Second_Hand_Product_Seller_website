/**
 * Shared profile / campus field options (User model enums).
 * Keep in sync with backend/src/shared/constants/profileForm.constants.js
 */

export const YEAR_OPTIONS = ['1st', '2nd', '3rd', '4th', '5th', 'Alumni', 'Faculty'];

export const PROFILE_ROLES = [
  { id: 'student', label: 'Student' },
  { id: 'faculty', label: 'Faculty' },
  { id: 'staff', label: 'Staff' },
  { id: 'alumni', label: 'Alumni' },
];

export const RESIDENT_TYPE_OPTIONS = [
  { id: 'hosteler', label: 'Hosteler' },
  { id: 'day_scholar', label: 'Day Scholar' },
  { id: 'faculty', label: 'Faculty Quarter' },
];

/** Shared labels / placeholders — keep aligned with sign-up and backend constants */
export const PROFILE_FIELD_LABELS = {
  name: { label: 'Full Name', placeholder: 'Enter your full name' },
  location: {
    label: 'Location (Optional)',
    placeholder: 'Hostel or area',
    completionKey: 'Area / hostel',
  },
  profileRole: { label: 'I am a…' },
  campusSection: { label: 'Campus Info' },
  department: { label: 'Department', placeholder: 'e.g. Computer Science' },
  course: { label: 'Course', placeholder: 'e.g. B.Tech CSE' },
  year: { label: 'Year' },
  semester: { label: 'Semester', placeholder: 'e.g. 4th Semester' },
  hostel: { label: 'Hostel (Optional)', placeholder: 'e.g. PG Boys Hostel' },
  residentType: { label: 'Resident Type' },
  email: { label: 'Email Address', hint: 'Verified at registration — cannot be changed' },
};

export const PROFILE_COMPLETION_CHECKLIST = [
  { label: 'Email Verified', key: 'Email verification' },
  { label: 'Full Name', key: 'Full name' },
  { label: 'Profile Photo', key: 'Profile photo' },
  { label: 'Department', key: 'Department' },
  { label: 'Course', key: 'Course' },
  { label: 'Campus Role', key: 'Campus role' },
  { label: 'Year / Study Level', key: 'Year / study level' },
  { label: 'Resident Type', key: 'Resident type' },
  { label: PROFILE_FIELD_LABELS.location.label, key: PROFILE_FIELD_LABELS.location.completionKey },
];

const VALID_PROFILE_ROLES = new Set(['student', 'faculty', 'staff', 'alumni', '']);
const VALID_YEARS = new Set(['', ...YEAR_OPTIONS]);
const VALID_RESIDENT_TYPES = new Set(['', 'hosteler', 'day_scholar', 'faculty']);

export function formatProfileRole(role) {
  if (!role) return '';
  const found = PROFILE_ROLES.find((r) => r.id === role);
  if (found) return found.label;
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function formatResidentType(type) {
  if (!type) return '';
  const found = RESIDENT_TYPE_OPTIONS.find((r) => r.id === type);
  return found?.label ?? type.replace(/_/g, ' ');
}

export function formatYearDisplay(year) {
  if (!year) return '';
  if (year === 'Alumni' || year === 'Faculty') return year;
  return `${year} Year`;
}

export function campusFromProfile(profile) {
  return {
    department: profile?.campus?.department || '',
    course: profile?.campus?.course || '',
    year: profile?.campus?.year || '',
    semester: profile?.campus?.semester || '',
    hostel: profile?.campus?.hostel || '',
    residentType: profile?.campus?.residentType || '',
  };
}

export function formDataFromProfile(profile) {
  return {
    name: profile?.name || '',
    email: profile?.email || '',
    location: profile?.location || '',
    profileRole: profile?.profileRole || 'student',
    avatar: profile?.avatar || '',
  };
}

/** @param {string} name @param {string} profileRole @param {ReturnType<typeof campusFromProfile>} campus */
export function validateProfileForm(name, profileRole, campus) {
  if (!name?.trim()) return 'Full name is required.';

  if (profileRole && !VALID_PROFILE_ROLES.has(profileRole)) {
    return 'Please select a valid campus role.';
  }

  if (campus?.year && !VALID_YEARS.has(campus.year)) {
    return 'Please select a valid year from the options.';
  }

  if (campus?.residentType && !VALID_RESIDENT_TYPES.has(campus.residentType)) {
    return 'Please select a valid resident type.';
  }

  return '';
}

export function showYearFieldForRole(profileRole) {
  return profileRole === 'student' || profileRole === 'faculty' || profileRole === 'alumni';
}
