const MIN_PROFILE_SCORE_FOR_TRADING = 60;

const computeProfileScore = (user) => {
  let score = 0;

  if (user.emailVerified) score += 10;                          // 10  – verified at registration via OTP
  if (user.name?.trim()) score += 15;                          // 25
  if (user.avatar?.trim()) score += 15;                        // 40
  if (user.campus?.department?.trim()) score += 15;            // 55
  if (user.campus?.course?.trim()) score += 10;                // 65
  if (user.profileRole) score += 10;                           // 75
  if (user.campus?.year && user.campus.year !== '') score += 10; // 85
  if (user.campus?.residentType && user.campus.residentType !== '') score += 10; // 95
  if (user.location?.trim()) score += 5;                       // 100

  return Math.min(score, 100);
};

const getProfileMissingFields = (user) => {
  const missing = [];

  if (!user.name?.trim()) missing.push('Full name');
  if (!user.avatar?.trim()) missing.push('Profile photo');
  if (!user.emailVerified) missing.push('Email verification');
  if (!user.campus?.department?.trim()) missing.push('Department');
  if (!user.campus?.course?.trim()) missing.push('Course');
  if (!user.profileRole) missing.push('Campus role');
  if (!user.campus?.year || user.campus.year === '') missing.push('Year / study level');
  if (!user.campus?.residentType || user.campus.residentType === '') missing.push('Resident type');
  if (!user.location?.trim()) missing.push('Preferred campus meetup area');

  return missing;
};

const canTradeOnCampus = (user) => {
  const score = computeProfileScore(user);
  const missing = getProfileMissingFields(user);

  return {
    score,
    missing,
    isComplete: missing.length === 0,
    canTrade: score >= MIN_PROFILE_SCORE_FOR_TRADING,
  };
};

module.exports = {
  MIN_PROFILE_SCORE_FOR_TRADING,
  computeProfileScore,
  getProfileMissingFields,
  canTradeOnCampus,
};
