import { Router } from 'express';
import { dashboardService } from '../services/health.service.js';
import { aiService } from '../services/ai.service.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, successResponse, getGreeting } from '../utils/helpers.js';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const dashboard = await dashboardService.getDashboard(req.user.id);
    const insight = await aiService.generateInsight(req.user.id);
    successResponse(res, { ...dashboard, greeting: getGreeting(), aiInsight: insight });
  })
);

export default router;
