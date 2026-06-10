export const PROFILE_FIELDS = [
  { key: 'name', weight: 8, check: (user) => !!user?.name },
  { key: 'age', weight: 7, check: (_, p) => p?.age != null },
  { key: 'gender', weight: 7, check: (_, p) => !!p?.gender },
  { key: 'height', weight: 7, check: (_, p) => p?.height != null },
  { key: 'weight', weight: 7, check: (_, p) => p?.weight != null },
  { key: 'wakeTime', weight: 6, check: (_, p) => !!p?.wakeTime },
  { key: 'bedTime', weight: 6, check: (_, p) => !!p?.bedTime },
  { key: 'activityLevel', weight: 8, check: (_, p) => !!p?.activityLevel },
  { key: 'healthGoals', weight: 10, check: (_, p) => Array.isArray(p?.healthGoals) && p.healthGoals.length > 0 },
  { key: 'notifications', weight: 6, check: (_, p) => p != null },
  { key: 'dailyWaterGoal', weight: 5, check: (_, p) => p?.dailyWaterGoal > 0 },
  { key: 'dailySleepGoal', weight: 5, check: (_, p) => p?.dailySleepGoal > 0 },
  { key: 'dailyCalorieGoal', weight: 5, check: (_, p) => p?.dailyCalorieGoal > 0 },
  { key: 'trackingMethod', weight: 6, check: (_, p) => !!p?.trackingMethod },
  { key: 'onboardingDone', weight: 7, check: (_, p) => p?.onboardingDone === true },
  { key: 'healthSetupDone', weight: 10, check: (_, p) => p?.healthSetupDone === true },
];

export function calculateProfileCompletion(user, profile, habitCount = 0) {
  let score = 0;
  const breakdown = {};

  for (const field of PROFILE_FIELDS) {
    const filled = field.key === 'notifications'
      ? profile != null
      : field.check(user, profile);
    if (filled) score += field.weight;
    breakdown[field.key] = filled;
  }

  if (habitCount > 0) {
    score += 10;
    breakdown.firstHabit = true;
  } else {
    breakdown.firstHabit = false;
  }

  return { percent: Math.min(100, score), breakdown };
}
