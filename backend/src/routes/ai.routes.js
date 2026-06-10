import { Router } from 'express';
import { body } from 'express-validator';
import { aiService } from '../services/ai.service.js';
import { authenticate } from '../middleware/auth.js';
import { validate, asyncHandler, successResponse } from '../utils/helpers.js';

const router = Router();
router.use(authenticate);

router.post(
  '/chat',
  [body('message').trim().notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const result = await aiService.chat(req.user.id, req.body.message);
    successResponse(res, result);
  })
);

router.get(
  '/history',
  asyncHandler(async (req, res) => {
    const history = await aiService.getHistory(req.user.id);
    successResponse(res, history);
  })
);

router.get(
  '/memories',
  asyncHandler(async (req, res) => {
    const memories = await aiService.getMemories(req.user.id);
    successResponse(res, memories);
  })
);

router.get(
  '/weekly-summary',
  asyncHandler(async (req, res) => {
    const summary = await aiService.generateWeeklySummary(req.user.id);
    successResponse(res, summary);
  })
);

router.get(
  '/insight',
  asyncHandler(async (req, res) => {
    const insight = await aiService.generateInsight(req.user.id);
    successResponse(res, { insight });
  })
);

export default router;
