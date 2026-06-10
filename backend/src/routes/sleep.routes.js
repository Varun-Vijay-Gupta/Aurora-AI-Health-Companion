import { Router } from 'express';
import { body } from 'express-validator';
import { sleepService } from '../services/tracking.service.js';
import { authenticate } from '../middleware/auth.js';
import { validate, asyncHandler, successResponse } from '../utils/helpers.js';

const router = Router();
router.use(authenticate);

router.post(
  '/',
  [body('hours').isFloat({ min: 0, max: 24 })],
  validate,
  asyncHandler(async (req, res) => {
    const log = await sleepService.logSleep(req.user.id, req.body);
    successResponse(res, log, 'Sleep logged', 201);
  })
);

router.get(
  '/today',
  asyncHandler(async (req, res) => {
    const data = await sleepService.getToday(req.user.id);
    successResponse(res, data);
  })
);

router.get(
  '/weekly',
  asyncHandler(async (req, res) => {
    const data = await sleepService.getWeekly(req.user.id);
    successResponse(res, data);
  })
);

router.get(
  '/monthly',
  asyncHandler(async (req, res) => {
    const data = await sleepService.getMonthly(req.user.id);
    successResponse(res, data);
  })
);

export default router;
