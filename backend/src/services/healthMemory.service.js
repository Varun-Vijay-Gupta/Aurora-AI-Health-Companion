import prisma from '../config/database.js';
import { getDaysAgo, getStartOfDay, getEndOfDay } from '../utils/helpers.js';

async function upsertMemory(userId, { category, patternType, title, content, metricValue, metricUnit, confidence, period }) {
  const existing = await prisma.healthMemory.findFirst({
    where: { userId, category, patternType, period },
    orderBy: { updatedAt: 'desc' },
  });

  if (existing) {
    return prisma.healthMemory.update({
      where: { id: existing.id },
      data: { title, content, metricValue, metricUnit, confidence },
    });
  }

  return prisma.healthMemory.create({
    data: { userId, category, patternType, title, content, metricValue, metricUnit, confidence, period },
  });
}

export const healthMemoryService = {
  async analyzeAndStore(userId) {
    const weekAgo = getDaysAgo(7);
    const monthAgo = getDaysAgo(30);
    const today = getStartOfDay();
    const endToday = getEndOfDay();

    const [profile, waterWeek, sleepWeek, habitCompletions, nutritionWeek, habits] = await Promise.all([
      prisma.healthProfile.findUnique({ where: { userId } }),
      prisma.waterLog.findMany({ where: { userId, loggedAt: { gte: weekAgo } } }),
      prisma.sleepLog.findMany({ where: { userId, loggedAt: { gte: weekAgo } } }),
      prisma.habitCompletion.findMany({ where: { userId, completedAt: { gte: weekAgo } } }),
      prisma.nutritionLog.findMany({ where: { userId, loggedAt: { gte: weekAgo } } }),
      prisma.habit.findMany({ where: { userId, isActive: true } }),
    ]);

    const memories = [];
    const waterGoal = profile?.dailyWaterGoal || 2500;

    if (waterWeek.length >= 3) {
      const dailyTotals = {};
      waterWeek.forEach((log) => {
        const day = log.loggedAt.toISOString().split('T')[0];
        dailyTotals[day] = (dailyTotals[day] || 0) + log.amount;
      });
      const days = Object.values(dailyTotals);
      const avgWater = days.reduce((a, b) => a + b, 0) / days.length;
      const goalHits = days.filter((d) => d >= waterGoal * 0.9).length;
      const consistency = Math.round((goalHits / days.length) * 100);

      memories.push(await upsertMemory(userId, {
        category: 'hydration',
        patternType: 'consistency',
        title: 'Hydration Consistency',
        content: `You average ${Math.round(avgWater)}ml/day. Hit ${goalHits} of ${days.length} days near your ${waterGoal}ml goal.`,
        metricValue: consistency,
        metricUnit: '%',
        confidence: 4,
        period: 'weekly',
      }));
    }

    if (sleepWeek.length >= 3) {
      const hours = sleepWeek.map((s) => s.hours);
      const avgSleep = hours.reduce((a, b) => a + b, 0) / hours.length;
      const mean = avgSleep;
      const variance = hours.reduce((s, h) => s + Math.pow(h - mean, 2), 0) / hours.length;
      const stdDev = Math.sqrt(variance);
      const sleepGoal = profile?.dailySleepGoal || 8;

      memories.push(await upsertMemory(userId, {
        category: 'sleep',
        patternType: 'trend',
        title: 'Sleep Pattern',
        content: `Average ${avgSleep.toFixed(1)}h/night with ${stdDev < 1 ? 'excellent' : stdDev < 2 ? 'moderate' : 'variable'} consistency. Goal: ${sleepGoal}h.`,
        metricValue: avgSleep,
        metricUnit: 'hours',
        confidence: 4,
        period: 'weekly',
      }));
    }

    if (habits.length > 0) {
      const expected = habits.length * 7;
      const rate = Math.round((habitCompletions.length / expected) * 100);

      memories.push(await upsertMemory(userId, {
        category: 'habits',
        patternType: 'completion_rate',
        title: 'Habit Consistency',
        content: `Completed ${habitCompletions.length} of ${expected} possible habit check-ins this week across ${habits.length} habits.`,
        metricValue: Math.min(100, rate),
        metricUnit: '%',
        confidence: 4,
        period: 'weekly',
      }));
    }

    if (nutritionWeek.length >= 3) {
      const dailyCal = {};
      nutritionWeek.forEach((log) => {
        const day = log.loggedAt.toISOString().split('T')[0];
        dailyCal[day] = (dailyCal[day] || 0) + log.calories;
      });
      const cals = Object.values(dailyCal);
      const avgCal = cals.reduce((a, b) => a + b, 0) / cals.length;
      const calorieGoal = profile?.dailyCalorieGoal || 2000;

      memories.push(await upsertMemory(userId, {
        category: 'nutrition',
        patternType: 'trend',
        title: 'Nutrition Trend',
        content: `Averaging ${Math.round(avgCal)} calories/day. Your goal is ${calorieGoal} cal.`,
        metricValue: avgCal,
        metricUnit: 'cal',
        confidence: 3,
        period: 'weekly',
      }));
    }

    const waterToday = waterWeek.filter((w) => w.loggedAt >= today && w.loggedAt <= endToday);
    if (profile?.wakeTime && waterToday.length === 0 && new Date().getHours() >= 12) {
      memories.push(await upsertMemory(userId, {
        category: 'general',
        patternType: 'observation',
        title: 'Midday Hydration Gap',
        content: `No water logged today yet. You typically wake at ${profile.wakeTime} — staying hydrated early helps energy levels.`,
        metricValue: null,
        metricUnit: null,
        confidence: 3,
        period: 'daily',
      }));
    }

    if (profile?.activityLevel) {
      memories.push(await upsertMemory(userId, {
        category: 'general',
        patternType: 'profile',
        title: 'Lifestyle Context',
        content: `Activity level: ${profile.activityLevel}. Goals: ${(profile.healthGoals || []).join(', ') || 'general wellness'}.`,
        metricValue: null,
        metricUnit: null,
        confidence: 5,
        period: 'monthly',
      }));
    }

    return memories;
  },

  async getMemories(userId, { limit = 20, category } = {}) {
    return prisma.healthMemory.findMany({
      where: { userId, ...(category && { category }) },
      orderBy: [{ confidence: 'desc' }, { updatedAt: 'desc' }],
      take: limit,
    });
  },

  async getHighlights(userId, limit = 4) {
    return prisma.healthMemory.findMany({
      where: { userId },
      orderBy: [{ confidence: 'desc' }, { updatedAt: 'desc' }],
      take: limit,
    });
  },

  async generateInsights(userId) {
    await this.analyzeAndStore(userId);
    const memories = await this.getMemories(userId, { limit: 12 });
    const profile = await prisma.healthProfile.findUnique({ where: { userId } });

    const insights = memories.map((m) => ({
      id: m.id,
      category: m.category,
      title: m.title,
      content: m.content,
      metricValue: m.metricValue,
      metricUnit: m.metricUnit,
      confidence: m.confidence,
      period: m.period,
      updatedAt: m.updatedAt,
    }));

    const personalized = [];

    if (profile?.healthGoals?.length) {
      personalized.push({
        type: 'goal',
        title: 'Your Health Goals',
        content: `You're focused on: ${profile.healthGoals.join(', ')}. Aurora tailors recommendations to these priorities.`,
        icon: '🎯',
      });
    }

    const hydration = memories.find((m) => m.category === 'hydration');
    if (hydration) {
      personalized.push({
        type: 'hydration',
        title: hydration.title,
        content: hydration.content,
        metric: hydration.metricValue,
        unit: hydration.metricUnit,
        icon: '💧',
      });
    }

    const sleep = memories.find((m) => m.category === 'sleep');
    if (sleep) {
      personalized.push({
        type: 'sleep',
        title: sleep.title,
        content: sleep.content,
        metric: sleep.metricValue,
        unit: sleep.metricUnit,
        icon: '🌙',
      });
    }

    const habits = memories.find((m) => m.category === 'habits');
    if (habits) {
      personalized.push({
        type: 'habits',
        title: habits.title,
        content: habits.content,
        metric: habits.metricValue,
        unit: habits.metricUnit,
        icon: '🔥',
      });
    }

    return { insights, personalized, memories };
  },

  async getContextForAI(userId) {
    const memories = await this.getMemories(userId, { limit: 8 });
    return memories.map((m) => ({
      category: m.category,
      pattern: m.patternType,
      observation: m.content,
      metric: m.metricValue ? `${m.metricValue}${m.metricUnit || ''}` : null,
    }));
  },
};
