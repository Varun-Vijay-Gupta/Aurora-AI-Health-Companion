import { Router } from 'express';
import { body } from 'express-validator';
import { onboardingService } from '../services/onboarding.service.js';
import { authenticate } from '../middleware/auth.js';
import { validate, asyncHandler, successResponse } from '../utils/helpers.js';

const router = Router();
router.use(authenticate);

router.get(
  '/status',
  asyncHandler(async (req, res) => {
    const status = await onboardingService.getStatus(req.user.id);
    successResponse(res, status);
  })
);

router.post(
  '/complete',
  [
    body('name').optional().trim().notEmpty(),
    body('age').optional({ nullable: true }).isInt({ min: 1, max: 120 }).toInt(),
    body('gender').optional().isString(),
    body('height').optional({ nullable: true }).isFloat({ min: 0 }).toFloat(),
    body('weight').optional({ nullable: true }).isFloat({ min: 0 }).toFloat(),
    body('wakeTime').optional().isString(),
    body('bedTime').optional().isString(),
    body('activityLevel').optional().isString(),
    body('healthGoals').optional().isArray(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const result = await onboardingService.completeOnboarding(req.user.id, req.body);
    successResponse(res, result, 'Onboarding completed');
  })
);

router.post(
  '/health-setup',
  [
    body('dailyWaterGoal').optional().isInt({ min: 500 }),
    body('dailySleepGoal').optional().isFloat({ min: 1, max: 24 }),
    body('dailyCalorieGoal').optional().isInt({ min: 500 }),
    body('trackingMethod').optional().isString(),
    body('firstHabit').optional().isObject(),
    body('age').optional({ nullable: true }).isInt({ min: 1, max: 120 }).toInt(),
    body('height').optional({ nullable: true }).isFloat({ min: 0 }).toFloat(),
    body('weight').optional({ nullable: true }).isFloat({ min: 0 }).toFloat(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const result = await onboardingService.completeHealthSetup(req.user.id, req.body);
    successResponse(res, result, 'Health setup completed');
  })
);

export default router;
