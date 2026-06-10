import prisma from '../config/database.js';
import { getStartOfDay, getEndOfDay, getDaysAgo } from '../utils/helpers.js';
import { AppError } from '../utils/helpers.js';
import { achievementService } from './achievement.service.js';
import { healthMemoryService } from './healthMemory.service.js';

const refreshMemory = (userId) => {
  healthMemoryService.analyzeAndStore(userId).catch(() => {});
};

export const waterService = {
  async logWater(userId, { amount, note }) {
    const log = await prisma.waterLog.create({
      data: { userId, amount, note },
    });
    await achievementService.checkWaterAchievements(userId);
    refreshMemory(userId);
    return log;
  },

  async getToday(userId) {
    const today = getStartOfDay();
    const endToday = getEndOfDay();
    const [logs, total, profile] = await Promise.all([
      prisma.waterLog.findMany({
        where: { userId, loggedAt: { gte: today, lte: endToday } },
        orderBy: { loggedAt: 'desc' },
      }),
      prisma.waterLog.aggregate({
        where: { userId, loggedAt: { gte: today, lte: endToday } },
        _sum: { amount: true },
      }),
      prisma.healthProfile.findUnique({ where: { userId } }),
    ]);
    return {
      logs,
      total: total._sum.amount || 0,
      goal: profile?.dailyWaterGoal || 2500,
    };
  },

  async getWeekly(userId) {
    const weekAgo = getDaysAgo(7);
    const logs = await prisma.waterLog.findMany({
      where: { userId, loggedAt: { gte: weekAgo } },
      orderBy: { loggedAt: 'asc' },
    });

    const dailyTotals = {};
    logs.forEach((log) => {
      const day = log.loggedAt.toISOString().split('T')[0];
      dailyTotals[day] = (dailyTotals[day] || 0) + log.amount;
    });

    return Object.entries(dailyTotals).map(([date, amount]) => ({ date, amount }));
  },

  async deleteLog(userId, logId) {
    const log = await prisma.waterLog.findFirst({ where: { id: logId, userId } });
    if (!log) throw new AppError('Log not found', 404);
    await prisma.waterLog.delete({ where: { id: logId } });
    return { message: 'Deleted' };
  },
};

export const sleepService = {
  async logSleep(userId, { hours, quality, bedTime, wakeTime, note }) {
    const log = await prisma.sleepLog.create({
      data: { userId, hours, quality, bedTime, wakeTime, note },
    });
    await achievementService.checkSleepAchievements(userId);
    refreshMemory(userId);
    return log;
  },

  async getToday(userId) {
    const today = getStartOfDay();
    const endToday = getEndOfDay();
    const [log, profile] = await Promise.all([
      prisma.sleepLog.findFirst({
        where: { userId, loggedAt: { gte: today, lte: endToday } },
        orderBy: { loggedAt: 'desc' },
      }),
      prisma.healthProfile.findUnique({ where: { userId } }),
    ]);
    return { log, goal: profile?.dailySleepGoal || 8 };
  },

  async getWeekly(userId) {
    const weekAgo = getDaysAgo(7);
    return prisma.sleepLog.findMany({
      where: { userId, loggedAt: { gte: weekAgo } },
      orderBy: { loggedAt: 'asc' },
    });
  },

  async getMonthly(userId) {
    const monthAgo = getDaysAgo(30);
    const logs = await prisma.sleepLog.findMany({
      where: { userId, loggedAt: { gte: monthAgo } },
      orderBy: { loggedAt: 'asc' },
    });

    const avgHours =
      logs.length > 0
        ? logs.reduce((s, l) => s + l.hours, 0) / logs.length
        : 0;
    const avgQuality =
      logs.length > 0
        ? logs.reduce((s, l) => s + l.quality, 0) / logs.length
        : 0;

    const consistency = this.calculateConsistency(logs);

    return { logs, avgHours, avgQuality, consistency };
  },

  calculateConsistency(logs) {
    if (logs.length < 3) return 50;
    const hours = logs.map((l) => l.hours);
    const mean = hours.reduce((a, b) => a + b, 0) / hours.length;
    const variance = hours.reduce((s, h) => s + Math.pow(h - mean, 2), 0) / hours.length;
    const stdDev = Math.sqrt(variance);
    return Math.max(0, Math.min(100, Math.round(100 - stdDev * 20)));
  },
};

export const habitService = {
  async create(userId, data) {
    const habit = await prisma.habit.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        icon: data.icon || '✨',
        color: data.color || '#6366f1',
        frequency: data.frequency || 'daily',
        streak: { create: { userId, type: 'habit' } },
      },
      include: { streak: true },
    });
    return habit;
  },

  async getAll(userId) {
    const today = getStartOfDay();
    const endToday = getEndOfDay();
    const habits = await prisma.habit.findMany({
      where: { userId, isActive: true },
      include: {
        streak: true,
        completions: {
          where: { completedAt: { gte: today, lte: endToday } },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return habits.map((h) => ({
      ...h,
      completedToday: h.completions.length > 0,
    }));
  },

  async update(userId, habitId, data) {
    const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
    if (!habit) throw new AppError('Habit not found', 404);
    return prisma.habit.update({
      where: { id: habitId },
      data,
      include: { streak: true },
    });
  },

  async delete(userId, habitId) {
    const habit = await prisma.habit.findFirst({ where: { id: habitId, userId } });
    if (!habit) throw new AppError('Habit not found', 404);
    await prisma.habit.update({ where: { id: habitId }, data: { isActive: false } });
    return { message: 'Habit deleted' };
  },

  async toggleComplete(userId, habitId) {
    const today = getStartOfDay();
    const endToday = getEndOfDay();
    const habit = await prisma.habit.findFirst({
      where: { id: habitId, userId },
      include: { streak: true },
    });
    if (!habit) throw new AppError('Habit not found', 404);

    const existing = await prisma.habitCompletion.findFirst({
      where: { habitId, completedAt: { gte: today, lte: endToday } },
    });

    if (existing) {
      await prisma.habitCompletion.delete({ where: { id: existing.id } });
      return { completed: false, habit };
    }

    await prisma.habitCompletion.create({ data: { userId, habitId } });
    await this.updateStreak(habitId, userId);
    await achievementService.checkHabitAchievements(userId);
    return { completed: true, habit };
  },

  async updateStreak(habitId, userId) {
    const streak = await prisma.streak.findFirst({ where: { habitId, userId } });
    if (!streak) return;

    const yesterday = getDaysAgo(1);
    const today = getStartOfDay();
    const lastActive = streak.lastActive ? new Date(streak.lastActive) : null;

    let newStreak = streak.currentStreak;
    if (!lastActive || lastActive < yesterday) {
      newStreak = 1;
    } else if (lastActive < today) {
      newStreak = streak.currentStreak + 1;
    }

    await prisma.streak.update({
      where: { id: streak.id },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, streak.longestStreak),
        lastActive: new Date(),
      },
    });
  },
};

export const nutritionService = {
  async logMeal(userId, data) {
    return prisma.nutritionLog.create({
      data: { userId, ...data },
    });
  },

  async getToday(userId) {
    const today = getStartOfDay();
    const endToday = getEndOfDay();
    const [logs, totals, profile] = await Promise.all([
      prisma.nutritionLog.findMany({
        where: { userId, loggedAt: { gte: today, lte: endToday } },
        orderBy: { loggedAt: 'desc' },
      }),
      prisma.nutritionLog.aggregate({
        where: { userId, loggedAt: { gte: today, lte: endToday } },
        _sum: { calories: true, protein: true, carbs: true, fat: true },
      }),
      prisma.healthProfile.findUnique({ where: { userId } }),
    ]);
    return {
      logs,
      totals: {
        calories: totals._sum.calories || 0,
        protein: totals._sum.protein || 0,
        carbs: totals._sum.carbs || 0,
        fat: totals._sum.fat || 0,
      },
      goal: profile?.dailyCalorieGoal || 2000,
    };
  },

  async getWeekly(userId) {
    const weekAgo = getDaysAgo(7);
    const logs = await prisma.nutritionLog.findMany({
      where: { userId, loggedAt: { gte: weekAgo } },
      orderBy: { loggedAt: 'asc' },
    });

    const dailyTotals = {};
    logs.forEach((log) => {
      const day = log.loggedAt.toISOString().split('T')[0];
      if (!dailyTotals[day]) dailyTotals[day] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      dailyTotals[day].calories += log.calories;
      dailyTotals[day].protein += log.protein;
      dailyTotals[day].carbs += log.carbs;
      dailyTotals[day].fat += log.fat;
    });

    return Object.entries(dailyTotals).map(([date, totals]) => ({ date, ...totals }));
  },

  async deleteLog(userId, logId) {
    const log = await prisma.nutritionLog.findFirst({ where: { id: logId, userId } });
    if (!log) throw new AppError('Log not found', 404);
    await prisma.nutritionLog.delete({ where: { id: logId } });
    return { message: 'Deleted' };
  },
};
