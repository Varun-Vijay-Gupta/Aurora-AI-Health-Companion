import prisma from '../config/database.js';

const DEFAULT_ACHIEVEMENTS = [
  { name: 'First Drop', description: 'Log your first water intake', icon: '💧', type: 'HYDRATION', threshold: 1 },
  { name: 'Hydration Hero', description: 'Meet water goal 7 days in a row', icon: '🌊', type: 'HYDRATION', threshold: 7 },
  { name: 'Sleep Starter', description: 'Log your first sleep entry', icon: '🌙', type: 'SLEEP', threshold: 1 },
  { name: 'Dream Achiever', description: 'Get 8+ hours of sleep', icon: '⭐', type: 'SLEEP', threshold: 8 },
  { name: 'Habit Builder', description: 'Create your first habit', icon: '🎯', type: 'HABIT', threshold: 1 },
  { name: 'Streak Master', description: 'Maintain a 7-day habit streak', icon: '🔥', type: 'STREAK', threshold: 7 },
  { name: 'Consistency King', description: 'Complete all habits for 5 days', icon: '👑', type: 'CONSISTENCY', threshold: 5 },
  { name: 'Nutrition Navigator', description: 'Log 10 meals', icon: '🥗', type: 'NUTRITION', threshold: 10 },
  { name: 'Wellness Warrior', description: 'Reach health score of 80+', icon: '🏆', type: 'MILESTONE', threshold: 80 },
  { name: 'Aurora Champion', description: 'Reach health score of 95+', icon: '🌟', type: 'MILESTONE', threshold: 95 },
];

export const achievementService = {
  async seedAchievements() {
    for (const ach of DEFAULT_ACHIEVEMENTS) {
      await prisma.achievement.upsert({
        where: { name: ach.name },
        update: {},
        create: ach,
      });
    }
  },

  async award(userId, achievementName) {
    const achievement = await prisma.achievement.findUnique({
      where: { name: achievementName },
    });
    if (!achievement) return null;

    const existing = await prisma.userAchievement.findUnique({
      where: { userId_achievementId: { userId, achievementId: achievement.id } },
    });
    if (existing) return null;

    const earned = await prisma.userAchievement.create({
      data: { userId, achievementId: achievement.id },
      include: { achievement: true },
    });

    await prisma.notification.create({
      data: {
        userId,
        type: 'ACHIEVEMENT',
        title: `Achievement Unlocked: ${achievement.name}`,
        message: achievement.description,
        link: '/achievements',
      },
    });

    return earned;
  },

  async getUserAchievements(userId) {
    const [earned, all] = await Promise.all([
      prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
        orderBy: { earnedAt: 'desc' },
      }),
      prisma.achievement.findMany(),
    ]);
    const earnedIds = new Set(earned.map((e) => e.achievementId));
    return {
      earned,
      locked: all.filter((a) => !earnedIds.has(a.id)),
    };
  },

  async checkWaterAchievements(userId) {
    const count = await prisma.waterLog.count({ where: { userId } });
    if (count >= 1) await this.award(userId, 'First Drop');
  },

  async checkSleepAchievements(userId) {
    const count = await prisma.sleepLog.count({ where: { userId } });
    if (count >= 1) await this.award(userId, 'Sleep Starter');

    const best = await prisma.sleepLog.findFirst({
      where: { userId },
      orderBy: { hours: 'desc' },
    });
    if (best && best.hours >= 8) await this.award(userId, 'Dream Achiever');
  },

  async checkHabitAchievements(userId) {
    const count = await prisma.habit.count({ where: { userId } });
    if (count >= 1) await this.award(userId, 'Habit Builder');

    const streaks = await prisma.streak.findMany({
      where: { userId, currentStreak: { gte: 7 } },
    });
    if (streaks.length > 0) await this.award(userId, 'Streak Master');
  },
};

export const notificationService = {
  async getAll(userId, { unreadOnly = false } = {}) {
    return prisma.notification.findMany({
      where: { userId, ...(unreadOnly && { read: false }) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  },

  async markRead(userId, notificationId) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { read: true },
    });
  },

  async markAllRead(userId) {
    return prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  },

  async create(userId, { type, title, message, link }) {
    return prisma.notification.create({
      data: { userId, type, title, message, link },
    });
  },
};

export const analyticsService = {
  async getAnalytics(userId) {
    const weekAgo = getDaysAgo(7);
    const monthAgo = getDaysAgo(30);

    const [waterLogs, sleepLogs, habitCompletions, nutritionLogs, profile] =
      await Promise.all([
        prisma.waterLog.findMany({
          where: { userId, loggedAt: { gte: monthAgo } },
          orderBy: { loggedAt: 'asc' },
        }),
        prisma.sleepLog.findMany({
          where: { userId, loggedAt: { gte: monthAgo } },
          orderBy: { loggedAt: 'asc' },
        }),
        prisma.habitCompletion.findMany({
          where: { userId, completedAt: { gte: monthAgo } },
        }),
        prisma.nutritionLog.findMany({
          where: { userId, loggedAt: { gte: monthAgo } },
          orderBy: { loggedAt: 'asc' },
        }),
        prisma.healthProfile.findUnique({ where: { userId } }),
      ]);

    const groupByDay = (logs, field) => {
      const map = {};
      logs.forEach((log) => {
        const day = log.loggedAt.toISOString().split('T')[0];
        map[day] = (map[day] || 0) + (log[field] || 0);
      });
      return Object.entries(map).map(([date, value]) => ({ date, value }));
    };

    return {
      hydration: groupByDay(waterLogs, 'amount'),
      sleep: sleepLogs.map((l) => ({
        date: l.loggedAt.toISOString().split('T')[0],
        hours: l.hours,
        quality: l.quality,
      })),
      habits: {
        totalCompletions: habitCompletions.length,
        weeklyCompletions: habitCompletions.filter(
          (c) => c.completedAt >= weekAgo
        ).length,
      },
      nutrition: groupByDay(nutritionLogs, 'calories'),
      healthScore: profile?.healthScore || 75,
    };
  },
};

function getDaysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(0, 0, 0, 0);
  return d;
}
