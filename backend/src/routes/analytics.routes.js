import { Router } from 'express';
import { achievementService, notificationService, analyticsService } from '../services/achievement.service.js';
import { dashboardService } from '../services/health.service.js';
import { reportService } from '../services/report.service.js';
import { authenticate } from '../middleware/auth.js';
import { asyncHandler, successResponse } from '../utils/helpers.js';

const router = Router();
router.use(authenticate);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const data = await analyticsService.getAnalytics(req.user.id);
    successResponse(res, data);
  })
);

router.get(
  '/achievements',
  asyncHandler(async (req, res) => {
    const data = await achievementService.getUserAchievements(req.user.id);
    successResponse(res, data);
  })
);

router.get(
  '/notifications',
  asyncHandler(async (req, res) => {
    const notifications = await notificationService.getAll(req.user.id);
    successResponse(res, notifications);
  })
);

router.put(
  '/notifications/:id/read',
  asyncHandler(async (req, res) => {
    await notificationService.markRead(req.user.id, req.params.id);
    successResponse(res, null, 'Marked as read');
  })
);

router.put(
  '/notifications/read-all',
  asyncHandler(async (req, res) => {
    await notificationService.markAllRead(req.user.id);
    successResponse(res, null, 'All marked as read');
  })
);

router.get(
  '/report/pdf',
  asyncHandler(async (req, res) => {
    const dashboard = await dashboardService.getDashboard(req.user.id);
    const pdf = await reportService.generateHealthReport(req.user, dashboard);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=aurora-health-report.pdf');
    res.send(pdf);
  })
);

export default router;
