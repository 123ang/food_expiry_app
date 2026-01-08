import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /users/me - Get current user profile
router.get(
  '/me',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const user = await AuthService.getUserById(userId);

    res.json({ user });
  })
);

// PATCH /users/me - Update user profile
router.patch(
  '/me',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const updates = req.body;

    const user = await AuthService.updateUser(userId, updates);

    res.json({
      message: 'Profile updated',
      user,
    });
  })
);

// GET /users/me/settings - Get user settings
router.get(
  '/me/settings',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const settings = await AuthService.getUserSettings(userId);

    res.json({ settings });
  })
);

// PATCH /users/me/settings - Update user settings
router.patch(
  '/me/settings',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const updates = req.body;

    const settings = await AuthService.updateUserSettings(userId, updates);

    res.json({
      message: 'Settings updated',
      settings,
    });
  })
);

export default router;

