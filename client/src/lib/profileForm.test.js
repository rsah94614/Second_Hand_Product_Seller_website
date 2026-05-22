import { describe, it, expect } from 'vitest';
import {
  validateProfileForm,
  formatProfileRole,
  formatResidentType,
  formatYearDisplay,
  YEAR_OPTIONS,
} from './profileForm';

describe('profileForm', () => {
  it('formats display labels', () => {
    expect(formatProfileRole('student')).toBe('Student');
    expect(formatResidentType('day_scholar')).toBe('Day Scholar');
    expect(formatYearDisplay('3rd')).toBe('3rd Year');
    expect(formatYearDisplay('Alumni')).toBe('Alumni');
  });

  it('validates enums consistently with backend', () => {
    expect(
      validateProfileForm('Jane', 'student', {
        department: '',
        course: '',
        year: 'bad',
        semester: '',
        hostel: '',
        residentType: '',
      })
    ).toMatch(/year/i);

    expect(
      validateProfileForm('', 'student', {
        department: '',
        course: '',
        year: '',
        semester: '',
        hostel: '',
        residentType: '',
      })
    ).toMatch(/name/i);

    expect(YEAR_OPTIONS).toContain('Faculty');
  });
});
