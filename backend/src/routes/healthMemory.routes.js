import { Router } from 'express';
import { healthMemoryService } from '../services/healthMemory.service.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, successResponse } from '../utils/helpers.js';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const memories = await healthMemoryService.getMemories(req.user.id, {
      category: req.query.category,
      limit: parseInt(req.query.limit || '20', 10),
    });
    successResponse(res, memories);
  })
);

router.get(
  '/insights',
  asyncHandler(async (req, res) => {
    const data = await healthMemoryService.generateInsights(req.user.id);
    successResponse(res, data);
  })
);

router.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const memories = await healthMemoryService.analyzeAndStore(req.user.id);
    successResponse(res, memories, 'Health memories refreshed');
  })
);

export default router;
