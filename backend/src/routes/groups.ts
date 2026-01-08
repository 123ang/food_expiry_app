import { Router, Request, Response } from 'express';
import { GroupService } from '../services/groupService';
import { groupValidation, validate } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// POST /groups - Create new group
router.post(
  '/',
  groupValidation.create,
  validate,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { name, description } = req.body;

    const group = await GroupService.createGroup(userId, name, description);

    res.status(201).json({
      message: 'Group created successfully',
      group,
    });
  })
);

// GET /groups - Get user's groups
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;

    const groups = await GroupService.getUserGroups(userId);

    res.json({ groups });
  })
);

// GET /groups/:id - Get group details
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const group = await GroupService.getGroupById(id, userId);

    res.json({ group });
  })
);

// PATCH /groups/:id - Update group
router.patch(
  '/:id',
  groupValidation.update,
  validate,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { id } = req.params;
    const updates = req.body;

    const group = await GroupService.updateGroup(id, userId, updates);

    res.json({
      message: 'Group updated successfully',
      group,
    });
  })
);

// DELETE /groups/:id - Delete group
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { id } = req.params;

    await GroupService.deleteGroup(id, userId);

    res.json({
      message: 'Group deleted successfully',
    });
  })
);

// GET /groups/:id/members - Get group members
router.get(
  '/:id/members',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const members = await GroupService.getGroupMembers(id, userId);

    res.json({ members });
  })
);

// DELETE /groups/:id/members/:userId - Remove member from group
router.delete(
  '/:id/members/:memberId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { id, memberId } = req.params;

    await GroupService.removeMember(id, userId, memberId);

    res.json({
      message: 'Member removed successfully',
    });
  })
);

// PATCH /groups/:id/members/:userId - Update member role
router.patch(
  '/:id/members/:memberId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { id, memberId } = req.params;
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({ error: 'Role is required' });
    }

    await GroupService.updateMemberRole(id, userId, memberId, role);

    res.json({
      message: 'Member role updated successfully',
    });
  })
);

export default router;

