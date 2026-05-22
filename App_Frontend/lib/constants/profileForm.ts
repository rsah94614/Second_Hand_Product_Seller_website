/**
 * Shared profile / campus field options (User model enums).
 * Keep in sync with:
 * - backend/src/shared/constants/profileForm.constants.js
 * - client/src/lib/profileForm.js
 */

export const YEAR_OPTIONS = ["1st", "2nd", "3rd", "4th", "5th", "Alumni", "Faculty"] as const;

export const PROFILE_ROLES = [
  { id: "student", label: "Student" },
  { id: "faculty", label: "Faculty" },
  { id: "staff", label: "Staff" },
  { id: "alumni", label: "Alumni" },
] as const;

export const RESIDENT_TYPE_OPTIONS = [
  { id: "hosteler", label: "Hosteler" },
  { id: "day_scholar", label: "Day Scholar" },
  { id: "faculty", label: "Faculty Quarter" },
] as const;

export const PROFILE_FIELD_LABELS = {
  name: { label: "Full Name", placeholder: "Enter your full name" },
  location: {
    label: "Location (Optional)",
    placeholder: "Hostel or area",
    completionKey: "Area / hostel",
  },
  profileRole: { label: "I am a…" },
  campusSection: { label: "Campus Info" },
  department: { label: "Department", placeholder: "e.g. Computer Science" },
  course: { label: "Course", placeholder: "e.g. B.Tech CSE" },
  year: { label: "Year" },
  semester: { label: "Semester", placeholder: "e.g. 4th Semester" },
  hostel: { label: "Hostel (Optional)", placeholder: "e.g. PG Boys Hostel" },
  residentType: { label: "Resident Type" },
  email: { label: "Email Address", hint: "Verified at registration — cannot be changed" },
} as const;

export const PROFILE_COMPLETION_CHECKLIST = [
  { label: "Email Verified", key: "Email verification" },
  { label: "Full Name", key: "Full name" },
  { label: "Profile Photo", key: "Profile photo" },
  { label: "Department", key: "Department" },
  { label: "Course", key: "Course" },
  { label: "Campus Role", key: "Campus role" },
  { label: "Year / Level", key: "Year / study level" },
  { label: "Resident Type", key: "Resident type" },
  { label: PROFILE_FIELD_LABELS.location.label, key: PROFILE_FIELD_LABELS.location.completionKey },
] as const;

const VALID_PROFILE_ROLES = new Set(["student", "faculty", "staff", "alumni", ""]);
const VALID_YEARS = new Set(["", ...YEAR_OPTIONS]);
const VALID_RESIDENT_TYPES = new Set(["", "hosteler", "day_scholar", "faculty"]);

export function formatProfileRole(role?: string): string {
  if (!role) return "";
  const found = PROFILE_ROLES.find((r) => r.id === role);
  if (found) return found.label;
  if (role === "alumni") return "Alumni";
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function formatResidentType(type?: string): string {
  if (!type) return "";
  const found = RESIDENT_TYPE_OPTIONS.find((r) => r.id === type);
  return found?.label ?? type.replace(/_/g, " ");
}

export function formatYearDisplay(year?: string): string {
  if (!year) return "";
  if (year === "Alumni" || year === "Faculty") return year;
  return `${year} Year`;
}

export interface CampusFormShape {
  department: string;
  course: string;
  year: string;
  semester: string;
  hostel: string;
  residentType: string;
}

export function validateProfileForm(
  name: string,
  profileRole: string,
  campus: CampusFormShape
): string {
  if (!name.trim()) return "Full name is required.";

  if (profileRole && !VALID_PROFILE_ROLES.has(profileRole)) {
    return "Please select a valid campus role.";
  }

  if (campus.year && !VALID_YEARS.has(campus.year)) {
    return "Please select a valid year from the options.";
  }

  if (campus.residentType && !VALID_RESIDENT_TYPES.has(campus.residentType)) {
    return "Please select a valid resident type.";
  }

  return "";
}
