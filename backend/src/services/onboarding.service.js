import prisma from '../config/database.js';
import { calculateProfileCompletion } from '../utils/profile.js';
import { healthMemoryService } from './healthMemory.service.js';

export const onboardingService = {
  async completeOnboarding(userId, data) {
    const {
      name,
      age,
      gender,
      height,
      weight,
      wakeTime,
      bedTime,
      activityLevel,
      healthGoals,
      notifyHydration,
      notifySleep,
      notifyHabits,
      notifyAiInsights,
    } = data;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        healthProfile: {
          update: {
            age: age != null ? parseInt(age, 10) : undefined,
            gender,
            height: height != null ? parseFloat(height) : undefined,
            weight: weight != null ? parseFloat(weight) : undefined,
            wakeTime,
            bedTime,
            activityLevel,
            healthGoals: healthGoals || [],
            notifyHydration: notifyHydration ?? true,
            notifySleep: notifySleep ?? true,
            notifyHabits: notifyHabits ?? true,
            notifyAiInsights: notifyAiInsights ?? true,
            onboardingDone: true,
          },
        },
      },
      include: { healthProfile: true },
    });

    const habitCount = await prisma.habit.count({ where: { userId, isActive: true } });
    const { percent } = calculateProfileCompletion(user, user.healthProfile, habitCount);

    await prisma.healthProfile.update({
      where: { userId },
      data: { profileCompletion: percent },
    });

    await healthMemoryService.analyzeAndStore(userId);

    return { user, profileCompletion: percent };
  },

  async completeHealthSetup(userId, data) {
    const {
      dailyWaterGoal,
      dailySleepGoal,
      dailyCalorieGoal,
      trackingMethod,
      firstHabit,
      age,
      height,
      weight,
    } = data;

    const profile = await prisma.healthProfile.update({
      where: { userId },
      data: {
        dailyWaterGoal: dailyWaterGoal != null ? parseInt(dailyWaterGoal, 10) : undefined,
        dailySleepGoal: dailySleepGoal != null ? parseFloat(dailySleepGoal) : undefined,
        dailyCalorieGoal: dailyCalorieGoal != null ? parseInt(dailyCalorieGoal, 10) : undefined,
        trackingMethod: trackingMethod || 'manual',
        ...(age != null && age !== '' && { age: parseInt(age, 10) }),
        ...(height != null && height !== '' && { height: parseFloat(height) }),
        ...(weight != null && weight !== '' && { weight: parseFloat(weight) }),
        healthSetupDone: true,
      },
    });

    if (firstHabit?.name) {
      const existing = await prisma.habit.findFirst({
        where: { userId, name: firstHabit.name, isActive: true },
      });
      if (!existing) {
        await prisma.habit.create({
          data: {
            userId,
            name: firstHabit.name,
            description: firstHabit.description,
            icon: firstHabit.icon || '✨',
            color: firstHabit.color || '#6366f1',
            streak: { create: { userId, type: 'habit' } },
          },
        });
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { healthProfile: true },
    });
    const habitCount = await prisma.habit.count({ where: { userId, isActive: true } });
    const { percent } = calculateProfileCompletion(user, profile, habitCount);

    await prisma.healthProfile.update({
      where: { userId },
      data: { profileCompletion: percent },
    });

    await healthMemoryService.analyzeAndStore(userId);

    return { profile: { ...profile, profileCompletion: percent }, habitCount };
  },

  async getStatus(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { healthProfile: true },
    });
    const habitCount = await prisma.habit.count({ where: { userId, isActive: true } });
    const { percent, breakdown } = calculateProfileCompletion(user, user?.healthProfile, habitCount);

    return {
      onboardingDone: user?.healthProfile?.onboardingDone ?? false,
      healthSetupDone: user?.healthProfile?.healthSetupDone ?? false,
      profileCompletion: percent,
      breakdown,
      profile: user?.healthProfile,
    };
  },
};
