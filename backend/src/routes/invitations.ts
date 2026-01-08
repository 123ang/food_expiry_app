import { Router, Request, Response } from 'express';
import { InvitationService } from '../services/invitationService';
import { groupValidation, validate } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// POST /invitations/send - Send invitation (also available as POST /groups/:id/invite)
router.post(
  '/send',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { group_id, email } = req.body;

    if (!group_id || !email) {
      return res.status(400).json({ error: 'group_id and email are required' });
    }

    const invitation = await InvitationService.sendInvitation(group_id, userId, email);

    res.status(201).json({
      message: 'Invitation sent successfully',
      invitation,
    });
  })
);

// GET /invitations - Get user's pending invitations
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;

    const invitations = await InvitationService.getUserInvitations(userId);

    res.json({ invitations });
  })
);

// POST /invitations/join - Join group via invite code
router.post(
  '/join',
  groupValidation.joinWithCode,
  validate,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { invite_code } = req.body;

    await InvitationService.joinGroupWithCode(invite_code, userId);

    res.json({
      message: 'Successfully joined the group',
    });
  })
);

// POST /invitations/:id/accept - Accept invitation
router.post(
  '/:id/accept',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { id } = req.params;

    await InvitationService.acceptInvitation(id, userId);

    res.json({
      message: 'Invitation accepted successfully',
    });
  })
);

// POST /invitations/:id/decline - Decline invitation
router.post(
  '/:id/decline',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { id } = req.params;

    await InvitationService.declineInvitation(id, userId);

    res.json({
      message: 'Invitation declined',
    });
  })
);

// GET /invitations/verify/:code - Verify invite code
router.get(
  '/verify/:code',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { code } = req.params;

    const result = await InvitationService.verifyInviteCode(code);

    res.json(result);
  })
);

export default router;

