import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { authValidation, validate } from '../middleware/validation';
import { authenticateToken, authenticateRefreshToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// POST /auth/register - Register new user
router.post(
  '/register',
  authValidation.register,
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, full_name, device_info } = req.body;

    const result = await AuthService.register(email, password, full_name, device_info);

    res.status(201).json({
      message: 'User registered successfully',
      user: result.user,
      tokens: result.tokens,
      device: result.device,
    });
  })
);

// POST /auth/login - Login user
router.post(
  '/login',
  authValidation.login,
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const { email, password, device_info } = req.body;

    const result = await AuthService.login(email, password, device_info);

    res.json({
      message: 'Login successful',
      user: result.user,
      tokens: result.tokens,
      device: result.device,
    });
  })
);

// POST /auth/refresh - Refresh access token
router.post(
  '/refresh',
  authenticateRefreshToken,
  asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const userId = req.user!.userId;
    const deviceId = req.user!.deviceId;

    const tokens = await AuthService.refreshAccessToken(refreshToken, userId, deviceId);

    res.json({
      message: 'Token refreshed',
      tokens,
    });
  })
);

// POST /auth/logout - Logout user
router.post(
  '/logout',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const deviceId = req.user!.deviceId;

    await AuthService.logout(userId, deviceId);

    res.json({
      message: 'Logout successful',
    });
  })
);

// POST /auth/forgot-password - Request a password reset email
router.post(
  '/forgot-password',
  authValidation.forgotPassword,
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body;

    await AuthService.requestPasswordReset(email);

    // Always return success to avoid leaking whether the email exists
    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  })
);

// POST /auth/reset-password - Reset password with token (link) or email+code (in-app)
router.post(
  '/reset-password',
  authValidation.resetPassword,
  validate,
  asyncHandler(async (req: Request, res: Response) => {
    const { token, email, code, password } = req.body;

    if (token) {
      await AuthService.resetPasswordWithToken(token, password);
    } else {
      await AuthService.resetPasswordWithCode(email, code.trim(), password);
    }

    res.json({
      message: 'Password has been reset successfully. Please log in with your new password.',
    });
  })
);

// DELETE /auth/me - Permanently delete the authenticated user's account
router.delete(
  '/me',
  authenticateToken,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    await AuthService.deleteAccount(userId);

    res.status(204).send();
  })
);

export default router;

