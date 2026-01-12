import { Router, Request, Response } from 'express';
import { WishService } from '../services/wishService';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /wish-items - Get wish items for a group
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { group_id } = req.query;

    if (!group_id) {
      res.status(400).json({ error: 'group_id is required' });
      return;
    }

    const items = await WishService.getWishItems(userId, group_id as string);

    res.json({ items });
  })
);

// GET /wish-items/:id - Get wish item by ID
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const item = await WishService.getWishItemById(userId, id);

    if (!item) {
      res.status(404).json({ error: 'Wish item not found' });
      return;
    }

    res.json({ item });
  })
);

// POST /wish-items - Create wish item
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { group_id, name, notes } = req.body;

    if (!group_id) {
      res.status(400).json({ error: 'group_id is required' });
      return;
    }

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const item = await WishService.createWishItem(userId, group_id, {
      name,
      notes,
    });

    res.status(201).json({ item });
  })
);

// PATCH /wish-items/:id - Update wish item
router.patch(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { name, notes } = req.body;

    const item = await WishService.updateWishItem(userId, id, {
      name,
      notes,
    });

    res.json({ item });
  })
);

// DELETE /wish-items/:id - Delete wish item
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { id } = req.params;

    await WishService.deleteWishItem(userId, id);

    res.status(204).send();
  })
);

export default router;
