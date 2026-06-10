import { config } from '../config/index.js';
import prisma from '../config/database.js';
import { waterService, sleepService, habitService, nutritionService } from './tracking.service.js';
import { healthMemoryService } from './healthMemory.service.js';
import { getStartOfDay, getEndOfDay, getDaysAgo } from '../utils/helpers.js';

const AI_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'log_water',
      description: 'Log water/hydration intake for the user',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number', description: 'Amount in milliliters (ml)' },
          note: { type: 'string', description: 'Optional note' },
        },
        required: ['amount'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'log_sleep',
      description: 'Log sleep hours for the user',
      parameters: {
        type: 'object',
        properties: {
          hours: { type: 'number', description: 'Hours of sleep' },
          quality: { type: 'number', description: 'Sleep quality 1-5' },
          note: { type: 'string', description: 'Optional note' },
        },
        required: ['hours'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_habit',
      description: 'Create a new habit for the user',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Habit name' },
          description: { type: 'string', description: 'Habit description' },
          icon: { type: 'string', description: 'Emoji icon' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'log_meal',
      description: 'Log a meal/nutrition entry',
      parameters: {
        type: 'object',
        properties: {
          mealName: { type: 'string' },
          mealType: { type: 'string', enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
          calories: { type: 'number' },
          protein: { type: 'number' },
          carbs: { type: 'number' },
          fat: { type: 'number' },
        },
        required: ['mealName'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_health_summary',
      description: 'Get user health summary for context',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'save_memory',
      description: 'Save an observation about user health behavior for future reference',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', enum: ['hydration', 'sleep', 'habits', 'nutrition', 'general'] },
          content: { type: 'string' },
          importance: { type: 'number', description: '1-5 importance level' },
        },
        required: ['category', 'content'],
      },
    },
  },
];

const SYSTEM_PROMPT = `You are Aurora, an intelligent AI health companion. You help users track hydration, sleep, habits, and nutrition. You provide personalized, empathetic health advice.

When users mention actions like drinking water, sleeping, or creating habits, use the appropriate function to log them automatically.

Be warm, encouraging, and concise. Use the user's health data to give personalized recommendations. Remember past observations stored in memory.

Always prioritize user wellbeing. Never provide medical diagnoses - recommend consulting healthcare professionals for medical concerns.`;

async function callGroq(messages, tools) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.ai.groqApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 1024,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error: ${err}`);
  }

  return response.json();
}

async function callGemini(messages) {
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

  const systemInstruction = messages.find((m) => m.role === 'system')?.content || SYSTEM_PROMPT;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${config.ai.geminiApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || 'I apologize, I could not generate a response.';
  return { choices: [{ message: { role: 'assistant', content: text } }] };
}

async function executeFunction(name, args, userId) {
  switch (name) {
    case 'log_water':
      return waterService.logWater(userId, args);
    case 'log_sleep':
      return sleepService.logSleep(userId, args);
    case 'create_habit':
      return habitService.create(userId, args);
    case 'log_meal':
      return nutritionService.logMeal(userId, args);
    case 'get_health_summary':
      return getHealthContext(userId);
    case 'save_memory':
      return prisma.aiMemory.create({
        data: { userId, category: args.category, content: args.content, importance: args.importance || 1 },
      });
    default:
      return { error: 'Unknown function' };
  }
}

async function getHealthContext(userId) {
  const today = getStartOfDay();
  const endToday = getEndOfDay();
  const weekAgo = getDaysAgo(7);

  const [profile, user, water, sleep, habits, nutrition, aiMemories, healthMemories] = await Promise.all([
    prisma.healthProfile.findUnique({ where: { userId } }),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
    prisma.waterLog.aggregate({
      where: { userId, loggedAt: { gte: today, lte: endToday } },
      _sum: { amount: true },
    }),
    prisma.sleepLog.findFirst({
      where: { userId, loggedAt: { gte: today, lte: endToday } },
      orderBy: { loggedAt: 'desc' },
    }),
    prisma.habit.findMany({ where: { userId, isActive: true } }),
    prisma.nutritionLog.aggregate({
      where: { userId, loggedAt: { gte: today, lte: endToday } },
      _sum: { calories: true, protein: true },
    }),
    prisma.aiMemory.findMany({
      where: { userId },
      orderBy: { importance: 'desc' },
      take: 5,
    }),
    healthMemoryService.getMemories(userId, { limit: 8 }),
  ]);

  return {
    userName: user?.name,
    waterToday: water._sum.amount || 0,
    waterGoal: profile?.dailyWaterGoal || 2500,
    sleepToday: sleep?.hours || 0,
    sleepGoal: profile?.dailySleepGoal || 8,
    activeHabits: habits.length,
    caloriesToday: nutrition._sum.calories || 0,
    healthScore: profile?.healthScore || 75,
    profile: {
      age: profile?.age,
      gender: profile?.gender,
      activityLevel: profile?.activityLevel,
      wakeTime: profile?.wakeTime,
      bedTime: profile?.bedTime,
      healthGoals: profile?.healthGoals || [],
      trackingMethod: profile?.trackingMethod,
    },
    healthMemories: healthMemories.map((m) => ({
      category: m.category,
      title: m.title,
      observation: m.content,
      metric: m.metricValue != null ? `${m.metricValue}${m.metricUnit || ''}` : null,
    })),
    aiMemories: aiMemories.map((m) => ({ category: m.category, content: m.content })),
  };
}

function detectIntent(message) {
  const lower = message.toLowerCase();
  const intents = [];

  const waterMatch = lower.match(/(?:drank|drink|had|log|add)\s*(\d+)\s*(?:ml|milliliters?|liters?|l|oz|ounces?|cups?)/i);
  if (waterMatch || lower.includes('water')) {
    let amount = 250;
    const mlMatch = lower.match(/(\d+)\s*ml/);
    const lMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:liters?|l\b)/);
    const ozMatch = lower.match(/(\d+)\s*(?:oz|ounces?)/);
    if (mlMatch) amount = parseInt(mlMatch[1]);
    else if (lMatch) amount = parseFloat(lMatch[1]) * 1000;
    else if (ozMatch) amount = Math.round(parseInt(ozMatch[1]) * 29.57);
    else if (waterMatch) amount = parseInt(waterMatch[1]);
    intents.push({ action: 'log_water', args: { amount } });
  }

  const sleepMatch = lower.match(/(?:slept|sleep|got)\s*(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)/i);
  if (sleepMatch) {
    intents.push({ action: 'log_sleep', args: { hours: parseFloat(sleepMatch[1]), quality: 3 } });
  }

  const habitMatch = lower.match(/(?:create|add|start|new)\s+(?:a\s+)?habit\s+(?:to\s+|for\s+)?(.+)/i);
  if (habitMatch) {
    intents.push({ action: 'create_habit', args: { name: habitMatch[1].trim() } });
  }

  return intents;
}

export const aiService = {
  async chat(userId, message) {
    await prisma.aiConversation.create({
      data: { userId, role: 'user', content: message },
    });

    const context = await getHealthContext(userId);
    const recentMessages = await prisma.aiConversation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const messages = [
      {
        role: 'system',
        content: `${SYSTEM_PROMPT}\n\nUser Health Context:\n${JSON.stringify(context, null, 2)}`,
      },
      ...recentMessages.reverse().map((m) => ({ role: m.role, content: m.content })),
    ];

    let responseText = '';
    let actionsPerformed = [];

    const intents = detectIntent(message);
    for (const intent of intents) {
      try {
        const result = await executeFunction(intent.action, intent.args, userId);
        actionsPerformed.push({ action: intent.action, result });
      } catch (e) {
        console.error('Intent execution error:', e.message);
      }
    }

    const hasApiKey =
      (config.ai.provider === 'groq' && config.ai.groqApiKey) ||
      (config.ai.provider === 'gemini' && config.ai.geminiApiKey) ||
      config.ai.groqApiKey ||
      config.ai.geminiApiKey;

    if (hasApiKey) {
      try {
        let aiResponse;
        if (config.ai.groqApiKey && config.ai.provider !== 'gemini') {
          aiResponse = await callGroq(messages, AI_TOOLS);

          const choice = aiResponse.choices[0];
          if (choice.message.tool_calls) {
            for (const toolCall of choice.message.tool_calls) {
              const fnName = toolCall.function.name;
              const fnArgs = JSON.parse(toolCall.function.arguments);
              const result = await executeFunction(fnName, fnArgs, userId);
              actionsPerformed.push({ action: fnName, result });
            }

            messages.push(choice.message);
            for (const toolCall of choice.message.tool_calls) {
              messages.push({
                role: 'tool',
                tool_call_id: toolCall.id,
                content: JSON.stringify(actionsPerformed.find((a) => a.action === toolCall.function.name)?.result),
              });
            }

            const followUp = await callGroq(messages, AI_TOOLS);
            responseText = followUp.choices[0].message.content;
          } else {
            responseText = choice.message.content;
          }
        } else if (config.ai.geminiApiKey) {
          aiResponse = await callGemini(messages);
          responseText = aiResponse.choices[0].message.content;
        }
      } catch (error) {
        console.error('AI API error:', error.message);
        responseText = generateFallbackResponse(message, context, actionsPerformed);
      }
    } else {
      responseText = generateFallbackResponse(message, context, actionsPerformed);
    }

    if (actionsPerformed.length > 0) {
      healthMemoryService.analyzeAndStore(userId).catch(() => {});
    }

    const saved = await prisma.aiConversation.create({
      data: {
        userId,
        role: 'assistant',
        content: responseText,
        metadata: actionsPerformed.length ? { actions: actionsPerformed } : undefined,
      },
    });

    return {
      message: responseText,
      conversationId: saved.id,
      actions: actionsPerformed,
    };
  },

  async getHistory(userId, limit = 50) {
    return prisma.aiConversation.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
  },

  async getMemories(userId) {
    return prisma.aiMemory.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  },

  async generateWeeklySummary(userId) {
    const weekAgo = getDaysAgo(7);
    const [water, sleep, habits, nutrition] = await Promise.all([
      prisma.waterLog.findMany({ where: { userId, loggedAt: { gte: weekAgo } } }),
      prisma.sleepLog.findMany({ where: { userId, loggedAt: { gte: weekAgo } } }),
      prisma.habitCompletion.findMany({ where: { userId, completedAt: { gte: weekAgo } } }),
      prisma.nutritionLog.findMany({ where: { userId, loggedAt: { gte: weekAgo } } }),
    ]);

    const avgWater = water.length ? water.reduce((s, w) => s + w.amount, 0) / 7 : 0;
    const avgSleep = sleep.length ? sleep.reduce((s, sl) => s + sl.hours, 0) / sleep.length : 0;

    return {
      summary: `This week you logged ${water.length} hydration entries averaging ${Math.round(avgWater)}ml/day. You slept an average of ${avgSleep.toFixed(1)} hours. You completed ${habits.length} habit tasks and logged ${nutrition.length} meals.`,
      stats: { avgWater, avgSleep, habitCompletions: habits.length, mealsLogged: nutrition.length },
    };
  },

  async generateInsight(userId) {
    const context = await getHealthContext(userId);
    const insights = [];

    if (context.waterToday < context.waterGoal * 0.5) {
      insights.push('Your hydration is below 50% today. Try drinking a glass of water now!');
    }
    if (context.sleepToday === 0) {
      insights.push('No sleep logged today. Remember to track your rest for better insights.');
    }
    if (context.healthScore >= 80) {
      insights.push('Great job! Your health score is excellent. Keep up the momentum!');
    } else if (context.healthScore < 50) {
      insights.push('Your health score needs attention. Focus on hydration and sleep tonight.');
    }

    return insights[0] || 'Stay consistent with your health goals. Small steps lead to big changes!';
  },
};

function generateFallbackResponse(message, context, actions) {
  if (actions.length > 0) {
    const actionDesc = actions.map((a) => {
      switch (a.action) {
        case 'log_water': return `Logged ${a.result.amount}ml of water 💧`;
        case 'log_sleep': return `Logged ${a.result.hours} hours of sleep 🌙`;
        case 'create_habit': return `Created habit "${a.result.name}" ✨`;
        case 'log_meal': return `Logged meal "${a.result.mealName}" 🍽️`;
        default: return `Completed ${a.action}`;
      }
    }).join('. ');
    return `${actionDesc}. Your health score is ${context.healthScore}. Keep going!`;
  }

  const lower = message.toLowerCase();
  if (lower.includes('water') || lower.includes('hydrat')) {
    return `You've had ${context.waterToday}ml today out of your ${context.waterGoal}ml goal. ${context.waterToday < context.waterGoal ? 'Keep hydrating!' : 'Great job hitting your goal! 💧'}`;
  }
  if (lower.includes('sleep')) {
    return context.sleepToday > 0
      ? `You logged ${context.sleepToday} hours of sleep today. ${context.sleepToday >= context.sleepGoal ? 'Well rested! 🌙' : 'Try to get more rest tonight.'}`
      : 'No sleep logged yet today. How many hours did you sleep?';
  }
  return `Hi! I'm Aurora, your health companion. Your current health score is ${context.healthScore}/100. Ask me about hydration, sleep, habits, or nutrition, or tell me what you've done today!`;
}
