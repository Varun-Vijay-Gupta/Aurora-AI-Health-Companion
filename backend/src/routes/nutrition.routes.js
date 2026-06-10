import { Router } from 'express';
import { body } from 'express-validator';
import { nutritionService } from '../services/tracking.service.js';
import { authenticate } from '../middleware/auth.js';
import { validate, asyncHandler, successResponse } from '../utils/helpers.js';

const router = Router();
router.use(authenticate);

router.post(
  '/',
  [body('mealName').trim().notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const log = await nutritionService.logMeal(req.user.id, req.body);
    successResponse(res, log, 'Meal logged', 201);
  })
);

router.get(
  '/today',
  asyncHandler(async (req, res) => {
    const data = await nutritionService.getToday(req.user.id);
    successResponse(res, data);
  })
);

router.get(
  '/weekly',
  asyncHandler(async (req, res) => {
    const data = await nutritionService.getWeekly(req.user.id);
    successResponse(res, data);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await nutritionService.deleteLog(req.user.id, req.params.id);
    successResponse(res, result);
  })
);

export default router;
