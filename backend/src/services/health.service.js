import prisma from '../config/database.js';
import { getStartOfDay, getEndOfDay, getDaysAgo } from '../utils/helpers.js';
import { calculateProfileCompletion } from '../utils/profile.js';
import { healthMemoryService } from './healthMemory.service.js';

export const healthScoreService = {
  async calculate(userId) {
    const today = getStartOfDay();
    const endToday = getEndOfDay();
    const weekAgo = getDaysAgo(7);

    const [profile, waterToday, sleepToday, habits, completions, nutritionToday] =
      await Promise.all([
        prisma.healthProfile.findUnique({ where: { userId } }),
        prisma.waterLog.aggregate({
          where: { userId, loggedAt: { gte: today, lte: endToday } },
          _sum: { amount: true },
        }),
        prisma.sleepLog.findFirst({
          where: { userId, loggedAt: { gte: today, lte: endToday } },
          orderBy: { loggedAt: 'desc' },
        }),
        prisma.habit.findMany({ where: { userId, isActive: true } }),
        prisma.habitCompletion.findMany({
          where: { userId, completedAt: { gte: today, lte: endToday } },
        }),
        prisma.nutritionLog.aggregate({
          where: { userId, loggedAt: { gte: today, lte: endToday } },
          _sum: { calories: true, protein: true },
        }),
      ]);

    const waterGoal = profile?.dailyWaterGoal || 2500;
    const sleepGoal = profile?.dailySleepGoal || 8;
    const waterAmount = waterToday._sum.amount || 0;
    const sleepHours = sleepToday?.hours || 0;
    const habitRate = habits.length
      ? (completions.length / habits.length) * 100
      : 50;

    const hydrationScore = Math.min(100, (waterAmount / waterGoal) * 100);
    const sleepScore = sleepToday ? Math.min(100, (sleepHours / sleepGoal) * 100) : 30;
    const nutritionScore = nutritionToday._sum.calories
      ? Math.min(100, 70 + (nutritionToday._sum.protein || 0) / 10)
      : 40;

    const score = Math.round(
      hydrationScore * 0.25 +
        sleepScore * 0.3 +
        habitRate * 0.25 +
        nutritionScore * 0.2
    );

    await prisma.healthProfile.update({
      where: { userId },
      data: { healthScore: score },
    });

    return {
      score,
      breakdown: {
        hydration: Math.round(hydrationScore),
        sleep: Math.round(sleepScore),
        habits: Math.round(habitRate),
        nutrition: Math.round(nutritionScore),
      },
    };
  },
};

export const dashboardService = {
  async getDashboard(userId) {
    const today = getStartOfDay();
    const endToday = getEndOfDay();
    const weekAgo = getDaysAgo(7);

    const [
      user,
      waterToday,
      sleepToday,
      habits,
      completionsToday,
      nutritionToday,
      weeklyWater,
      weeklySleep,
      achievements,
      notifications,
      healthScore,
      memoryHighlights,
    ] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        include: { healthProfile: true },
      }),
      prisma.waterLog.aggregate({
        where: { userId, loggedAt: { gte: today, lte: endToday } },
        _sum: { amount: true },
      }),
      prisma.sleepLog.findFirst({
        where: { userId, loggedAt: { gte: today, lte: endToday } },
        orderBy: { loggedAt: 'desc' },
      }),
      prisma.habit.findMany({
        where: { userId, isActive: true },
        include: { streak: true },
      }),
      prisma.habitCompletion.findMany({
        where: { userId, completedAt: { gte: today, lte: endToday } },
      }),
      prisma.nutritionLog.aggregate({
        where: { userId, loggedAt: { gte: today, lte: endToday } },
        _sum: { calories: true, protein: true, carbs: true, fat: true },
      }),
      prisma.waterLog.groupBy({
        by: ['loggedAt'],
        where: { userId, loggedAt: { gte: weekAgo } },
        _sum: { amount: true },
      }),
      prisma.sleepLog.findMany({
        where: { userId, loggedAt: { gte: weekAgo } },
        orderBy: { loggedAt: 'asc' },
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
        orderBy: { earnedAt: 'desc' },
        take: 5,
      }),
      prisma.notification.findMany({
        where: { userId, read: false },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      healthScoreService.calculate(userId),
      healthMemoryService.getHighlights(userId, 4),
    ]);

    const { percent: profileCompletion, breakdown: profileBreakdown } = calculateProfileCompletion(
      user,
      user?.healthProfile,
      habits.length
    );

    if (user?.healthProfile && user.healthProfile.profileCompletion !== profileCompletion) {
      await prisma.healthProfile.update({
        where: { userId },
        data: { profileCompletion },
      });
      user.healthProfile.profileCompletion = profileCompletion;
    }

    const completedHabitIds = new Set(completionsToday.map((c) => c.habitId));
    const habitsWithStatus = habits.map((h) => ({
      ...h,
      completedToday: completedHabitIds.has(h.id),
    }));

    const waterGoal = user?.healthProfile?.dailyWaterGoal || 2500;
    const sleepGoal = user?.healthProfile?.dailySleepGoal || 8;

    return {
      user: {
        name: user.name,
        avatar: user.avatar,
        healthProfile: user.healthProfile,
      },
      healthScore,
      hydration: {
        current: waterToday._sum.amount || 0,
        goal: waterGoal,
        percentage: Math.min(100, ((waterToday._sum.amount || 0) / waterGoal) * 100),
      },
      sleep: {
        hours: sleepToday?.hours || 0,
        goal: sleepGoal,
        quality: sleepToday?.quality || 0,
        percentage: sleepToday
          ? Math.min(100, (sleepToday.hours / sleepGoal) * 100)
          : 0,
      },
      nutrition: {
        calories: nutritionToday._sum.calories || 0,
        protein: nutritionToday._sum.protein || 0,
        carbs: nutritionToday._sum.carbs || 0,
        fat: nutritionToday._sum.fat || 0,
        goal: user?.healthProfile?.dailyCalorieGoal || 2000,
      },
      habits: {
        total: habits.length,
        completed: completionsToday.length,
        rate: habits.length
          ? Math.round((completionsToday.length / habits.length) * 100)
          : 0,
        items: habitsWithStatus,
      },
      weeklyTrends: {
        water: weeklyWater,
        sleep: weeklySleep,
      },
      achievements,
      notifications,
      profile: {
        healthProfile: user?.healthProfile,
        completion: profileCompletion,
        breakdown: profileBreakdown,
        lifestyle: {
          wakeTime: user?.healthProfile?.wakeTime,
          bedTime: user?.healthProfile?.bedTime,
          activityLevel: user?.healthProfile?.activityLevel,
          trackingMethod: user?.healthProfile?.trackingMethod,
        },
        goals: user?.healthProfile?.healthGoals || [],
        notifications: {
          hydration: user?.healthProfile?.notifyHydration,
          sleep: user?.healthProfile?.notifySleep,
          habits: user?.healthProfile?.notifyHabits,
          aiInsights: user?.healthProfile?.notifyAiInsights,
        },
      },
      memoryHighlights,
    };
  },
};
