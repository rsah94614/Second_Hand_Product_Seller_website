const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateProfilePayload, YEAR_OPTIONS, PROFILE_ROLES } = require('../src/shared/constants/profileForm.constants');

describe('profileForm.constants', () => {
  it('exports canonical option lists', () => {
    assert.ok(YEAR_OPTIONS.includes('1st'));
    assert.ok(PROFILE_ROLES.includes('faculty'));
  });

  it('rejects invalid campus enums', () => {
    const msg = validateProfilePayload({
      name: 'Test User',
      profileRole: 'student',
      campus: { year: '6th', residentType: 'commuter' },
    });
    assert.ok(msg);
    assert.match(msg, /year/i);
    assert.match(msg, /resident/i);
  });

  it('accepts valid profile payload', () => {
    const msg = validateProfilePayload({
      name: 'Test User',
      profileRole: 'student',
      campus: { year: '2nd', residentType: 'hosteler' },
    });
    assert.equal(msg, null);
  });

  it('requires non-empty name when provided', () => {
    const msg = validateProfilePayload({ name: '   ', profileRole: 'student' });
    assert.match(msg, /name/i);
  });
});
