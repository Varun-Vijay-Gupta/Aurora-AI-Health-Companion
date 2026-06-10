import { Router } from 'express';
import { body } from 'express-validator';
import { waterService } from '../services/tracking.service.js';
import { authenticate } from '../middleware/auth.js';
import { validate, asyncHandler, successResponse } from '../utils/helpers.js';

const router = Router();
router.use(authenticate);

router.post(
  '/',
  [body('amount').isInt({ min: 1 })],
  validate,
  asyncHandler(async (req, res) => {
    const log = await waterService.logWater(req.user.id, req.body);
    successResponse(res, log, 'Water logged', 201);
  })
);

router.get(
  '/today',
  asyncHandler(async (req, res) => {
    const data = await waterService.getToday(req.user.id);
    successResponse(res, data);
  })
);

router.get(
  '/weekly',
  asyncHandler(async (req, res) => {
    const data = await waterService.getWeekly(req.user.id);
    successResponse(res, data);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await waterService.deleteLog(req.user.id, req.params.id);
    successResponse(res, result);
  })
);

export default router;
