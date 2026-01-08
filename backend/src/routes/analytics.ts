import { Router, Request, Response } from 'express';
import { AnalyticsService } from '../services/analyticsService';
import { analyticsValidation, validate } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /analytics/summary - Get waste summary
router.get(
  '/summary',
  analyticsValidation.summary,
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { group_id, start_date, end_date, months } = req.query;

    if (!group_id) {
      return res.status(400).json({ error: 'group_id is required' });
    }

    const monthsNum = months ? parseInt(months as string) : 3;

    const summary = await AnalyticsService.getWasteSummary(
      userId,
      group_id as string,
      start_date as string,
      end_date as string,
      monthsNum
    );

    res.json({ summary });
  })
);

// GET /analytics/category-breakdown - Get category breakdown
router.get(
  '/category-breakdown',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { group_id, start_date, end_date } = req.query;

    if (!group_id) {
      return res.status(400).json({ error: 'group_id is required' });
    }

    const breakdown = await AnalyticsService.getCategoryBreakdown(
      userId,
      group_id as string,
      start_date as string,
      end_date as string
    );

    res.json({ breakdown });
  })
);

// GET /analytics/location-breakdown - Get location breakdown
router.get(
  '/location-breakdown',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { group_id, start_date, end_date } = req.query;

    if (!group_id) {
      return res.status(400).json({ error: 'group_id is required' });
    }

    const breakdown = await AnalyticsService.getLocationBreakdown(
      userId,
      group_id as string,
      start_date as string,
      end_date as string
    );

    res.json({ breakdown });
  })
);

// GET /analytics/monthly-trends - Get monthly trends
router.get(
  '/monthly-trends',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { group_id, months } = req.query;

    if (!group_id) {
      return res.status(400).json({ error: 'group_id is required' });
    }

    const monthsNum = months ? parseInt(months as string) : 12;

    const trends = await AnalyticsService.getMonthlyTrends(
      userId,
      group_id as string,
      monthsNum
    );

    res.json({ trends });
  })
);

// GET /analytics/most-wasted - Get most wasted items
router.get(
  '/most-wasted',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { group_id, limit } = req.query;

    if (!group_id) {
      return res.status(400).json({ error: 'group_id is required' });
    }

    const limitNum = limit ? parseInt(limit as string) : 10;

    const items = await AnalyticsService.getMostWastedItems(
      userId,
      group_id as string,
      limitNum
    );

    res.json({ items });
  })
);

// GET /analytics/disposal-reasons - Get disposal reasons breakdown
router.get(
  '/disposal-reasons',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { group_id } = req.query;

    if (!group_id) {
      return res.status(400).json({ error: 'group_id is required' });
    }

    const reasons = await AnalyticsService.getDisposalReasons(
      userId,
      group_id as string
    );

    res.json({ reasons });
  })
);

// GET /analytics/expiry-patterns - Get expiry patterns
router.get(
  '/expiry-patterns',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { group_id } = req.query;

    if (!group_id) {
      return res.status(400).json({ error: 'group_id is required' });
    }

    const patterns = await AnalyticsService.getExpiryPatterns(
      userId,
      group_id as string
    );

    res.json({ patterns });
  })
);

// GET /analytics/comprehensive - Get all analytics in one call
router.get(
  '/comprehensive',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { group_id, months } = req.query;

    if (!group_id) {
      return res.status(400).json({ error: 'group_id is required' });
    }

    const monthsNum = months ? parseInt(months as string) : 3;

    const analytics = await AnalyticsService.getComprehensiveAnalytics(
      userId,
      group_id as string,
      monthsNum
    );

    res.json({ analytics });
  })
);

export default router;

