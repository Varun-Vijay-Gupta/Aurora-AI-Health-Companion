import { Router } from 'express';
import { body } from 'express-validator';
import { habitService } from '../services/tracking.service.js';
import { authenticate } from '../middleware/auth.js';
import { validate, asyncHandler, successResponse } from '../utils/helpers.js';

const router = Router();
router.use(authenticate);

router.post(
  '/',
  [body('name').trim().notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const habit = await habitService.create(req.user.id, req.body);
    successResponse(res, habit, 'Habit created', 201);
  })
);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const habits = await habitService.getAll(req.user.id);
    successResponse(res, habits);
  })
);

router.put(
  '/:id',
  asyncHandler(async (req, res) => {
    const habit = await habitService.update(req.user.id, req.params.id, req.body);
    successResponse(res, habit, 'Habit updated');
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const result = await habitService.delete(req.user.id, req.params.id);
    successResponse(res, result);
  })
);

router.post(
  '/:id/toggle',
  asyncHandler(async (req, res) => {
    const result = await habitService.toggleComplete(req.user.id, req.params.id);
    successResponse(res, result);
  })
);

export default router;
