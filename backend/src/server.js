import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { config } from './config/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';
import { achievementService } from './services/achievement.service.js';

import authRoutes from './routes/auth.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import waterRoutes from './routes/water.routes.js';
import sleepRoutes from './routes/sleep.routes.js';
import habitsRoutes from './routes/habits.routes.js';
import nutritionRoutes from './routes/nutrition.routes.js';
import aiRoutes from './routes/ai.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import onboardingRoutes from './routes/onboarding.routes.js';
import healthMemoryRoutes from './routes/healthMemory.routes.js';

console.log('🚀 Aurora server initializing...');

const app = express();

// Security & Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin',
    },
  })
);

app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);

app.use(
  morgan(
    config.nodeEnv === 'development'
      ? 'dev'
      : 'combined'
  )
);

app.use(
  express.json({
    limit: '10mb',
  })
);

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    success: false,
    message: 'Too many requests',
  },
});

app.use('/api', limiter);

// Root Route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Aurora Backend Running',
  });
});

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Aurora API is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/water', waterRoutes);
app.use('/api/sleep', sleepRoutes);
app.use('/api/habits', habitsRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/health-memory', healthMemoryRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Start Server
const start = async () => {
  try {
    const PORT = process.env.PORT || config.port || 5000;

    app.listen(PORT, () => {
      console.log(`🌟 Aurora API running on port ${PORT}`);
      console.log(`📡 Environment: ${config.nodeEnv}`);
    });

    // Seed achievements safely
    try {
      await achievementService.seedAchievements();
      console.log('✅ Achievements seeded successfully');
    } catch (seedError) {
      console.error(
        '⚠️ Achievement seeding skipped:',
        seedError.message
      );
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

start();

export default app;