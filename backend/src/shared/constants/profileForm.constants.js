/**
 * Canonical profile / campus field enums (User model + all clients).
 * Keep in sync with App_Frontend/lib/constants/profileForm.ts and client/src/lib/profileForm.js
 */

const YEAR_OPTIONS = ['1st', '2nd', '3rd', '4th', '5th', 'Alumni', 'Faculty'];

const PROFILE_ROLES = ['student', 'faculty', 'staff', 'alumni'];

const RESIDENT_TYPES = ['hosteler', 'day_scholar', 'faculty'];

const VALID_PROFILE_ROLES = new Set(['', ...PROFILE_ROLES]);
const VALID_YEARS = new Set(['', ...YEAR_OPTIONS]);
const VALID_RESIDENT_TYPES = new Set(['', ...RESIDENT_TYPES]);

const CAMPUS_FIELDS = ['department', 'course', 'year', 'semester', 'hostel', 'residentType'];

/** Must match getProfileMissingFields() and all client completion UIs */
const COMPLETION_MISSING_LOCATION = 'Area / hostel';

const PROFILE_FIELD_LABELS = {
  name: { label: 'Full Name', placeholder: 'Enter your full name' },
  location: {
    label: 'Location (Optional)',
    placeholder: 'Hostel or area',
    completionKey: COMPLETION_MISSING_LOCATION,
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

const PROFILE_COMPLETION_CHECKLIST = [
  { label: 'Email Verified', key: 'Email verification' },
  { label: 'Full Name', key: 'Full name' },
  { label: 'Profile Photo', key: 'Profile photo' },
  { label: 'Department', key: 'Department' },
  { label: 'Course', key: 'Course' },
  { label: 'Campus Role', key: 'Campus role' },
  { label: 'Year / Study Level', key: 'Year / study level' },
  { label: 'Resident Type', key: 'Resident type' },
  { label: 'Location (Optional)', key: COMPLETION_MISSING_LOCATION },
];

/**
 * @param {{ name?: string, profileRole?: string, campus?: Record<string, string> }} body
 * @returns {string|null}
 */
function validateProfilePayload(body = {}) {
  const messages = [];

  if (body.name !== undefined && !String(body.name).trim()) {
    messages.push('Full name is required.');
  }

  if (
    body.profileRole !== undefined &&
    body.profileRole !== '' &&
    !VALID_PROFILE_ROLES.has(body.profileRole)
  ) {
    messages.push('Please select a valid campus role.');
  }

  if (body.campus && typeof body.campus === 'object') {
    if (
      body.campus.year !== undefined &&
      body.campus.year !== '' &&
      !VALID_YEARS.has(body.campus.year)
    ) {
      messages.push('Please select a valid year from the options.');
    }
    if (
      body.campus.residentType !== undefined &&
      body.campus.residentType !== '' &&
      !VALID_RESIDENT_TYPES.has(body.campus.residentType)
    ) {
      messages.push('Please select a valid resident type.');
    }
  }

  return messages.length > 0 ? messages.join(' ') : null;
}

module.exports = {
  YEAR_OPTIONS,
  PROFILE_ROLES,
  RESIDENT_TYPES,
  CAMPUS_FIELDS,
  COMPLETION_MISSING_LOCATION,
  PROFILE_FIELD_LABELS,
  PROFILE_COMPLETION_CHECKLIST,
  VALID_PROFILE_ROLES,
  VALID_YEARS,
  VALID_RESIDENT_TYPES,
  validateProfilePayload,
};
