import { Router, Request, Response } from 'express';
import { ShoppingService } from '../services/shoppingService';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /shopping-items - Get shopping items for a group
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { group_id, include_purchased } = req.query;

    if (!group_id) {
      res.status(400).json({ error: 'group_id is required' });
      return;
    }

    const items = await ShoppingService.getShoppingItems(
      userId,
      group_id as string,
      include_purchased === 'true'
    );

    res.json({ items });
  })
);

// GET /shopping-items/:id - Get shopping item by ID
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const item = await ShoppingService.getShoppingItemById(userId, id);

    if (!item) {
      res.status(404).json({ error: 'Shopping item not found' });
      return;
    }

    res.json({ item });
  })
);

// POST /shopping-items - Create shopping item
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { group_id, name, quantity, unit, category_id, notes } = req.body;

    if (!group_id) {
      res.status(400).json({ error: 'group_id is required' });
      return;
    }

    if (!name || !name.trim()) {
      res.status(400).json({ error: 'name is required' });
      return;
    }

    const item = await ShoppingService.createShoppingItem(userId, group_id, {
      name,
      quantity,
      unit,
      category_id,
      notes,
    });

    res.status(201).json({ item });
  })
);

// PATCH /shopping-items/:id - Update shopping item
router.patch(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { name, quantity, unit, category_id, is_purchased, notes } = req.body;

    const item = await ShoppingService.updateShoppingItem(userId, id, {
      name,
      quantity,
      unit,
      category_id,
      is_purchased,
      notes,
    });

    res.json({ item });
  })
);

// DELETE /shopping-items/:id - Delete shopping item
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { id } = req.params;

    await ShoppingService.deleteShoppingItem(userId, id);

    res.status(204).send();
  })
);

// POST /shopping-items/:id/toggle - Toggle purchase status
router.post(
  '/:id/toggle',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const item = await ShoppingService.togglePurchaseStatus(userId, id);

    res.json({ item });
  })
);

// POST /shopping-items/clear-purchased - Clear purchased items
router.post(
  '/clear-purchased',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { group_id } = req.body;

    if (!group_id) {
      res.status(400).json({ error: 'group_id is required' });
      return;
    }

    const deletedCount = await ShoppingService.clearPurchasedItems(userId, group_id);

    res.json({ deleted_count: deletedCount });
  })
);

export default router;
