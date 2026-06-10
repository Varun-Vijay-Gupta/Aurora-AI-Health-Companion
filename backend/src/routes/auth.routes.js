import { Router } from 'express';
import { body } from 'express-validator';
import { authService } from '../services/auth.service.js';
import { authenticate } from '../middleware/auth.js';
import { validate, asyncHandler, successResponse } from '../utils/helpers.js';

const router = Router();

router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    successResponse(res, result, 'Registration successful', 201);
  })
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    successResponse(res, result, 'Login successful');
  })
);

router.post(
  '/google',
  [body('credential').notEmpty()],
  validate,
  asyncHandler(async (req, res) => {
    const result = await authService.googleAuth(req.body.credential);
    successResponse(res, result, 'Google authentication successful');
  })
);

router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  validate,
  asyncHandler(async (req, res) => {
    const result = await authService.forgotPassword(req.body.email);
    successResponse(res, result);
  })
);

router.post(
  '/reset-password',
  [body('token').notEmpty(), body('password').isLength({ min: 6 })],
  validate,
  asyncHandler(async (req, res) => {
    const result = await authService.resetPassword(req.body.token, req.body.password);
    successResponse(res, result);
  })
);

router.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await authService.getProfile(req.user.id);
    successResponse(res, user);
  })
);

router.put(
  '/profile',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await authService.updateProfile(req.user.id, req.body);
    successResponse(res, user, 'Profile updated');
  })
);

export default router;
