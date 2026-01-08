import { Router, Request, Response } from 'express';
import { FoodItemService } from '../services/foodItemService';
import { foodItemValidation, validate } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// POST /food-items - Create food item
router.post(
  '/',
  foodItemValidation.create,
  validate,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const itemData = req.body;

    const item = await FoodItemService.createFoodItem(userId, itemData);

    res.status(201).json({
      message: 'Food item created successfully',
      item,
    });
  })
);

// GET /food-items - Get food items for a group
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { group_id, category_id, location_id, is_consumed, status } = req.query;

    if (!group_id) {
      res.status(400).json({ error: 'group_id is required' });
      return;
    }

    const filters = {
      category_id,
      location_id,
      is_consumed: is_consumed === 'true',
      status,
    };

    const items = await FoodItemService.getFoodItems(userId, group_id as string, filters);

    res.json({ items });
  })
);

// GET /food-items/expiring - Get items expiring soon
router.get(
  '/expiring',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { group_id, days } = req.query;

    if (!group_id) {
      res.status(400).json({ error: 'group_id is required' });
      return;
    }

    const daysAhead = days ? parseInt(days as string) : 3;
    const items = await FoodItemService.getExpiringItems(userId, group_id as string, daysAhead);

    res.json({ items });
  })
);

// GET /food-items/expired - Get expired items
router.get(
  '/expired',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { group_id } = req.query;

    if (!group_id) {
      res.status(400).json({ error: 'group_id is required' });
      return;
    }

    const items = await FoodItemService.getExpiredItems(userId, group_id as string);

    res.json({ items });
  })
);

// GET /food-items/:id - Get single food item
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const item = await FoodItemService.getFoodItemById(userId, id);

    res.json({ item });
  })
);

// PATCH /food-items/:id - Update food item
router.patch(
  '/:id',
  foodItemValidation.update,
  validate,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { id } = req.params;
    const updates = req.body;

    const item = await FoodItemService.updateFoodItem(userId, id, updates);

    res.json({
      message: 'Food item updated successfully',
      item,
    });
  })
);

// DELETE /food-items/:id - Delete food item
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { id } = req.params;

    await FoodItemService.deleteFoodItem(userId, id);

    res.json({
      message: 'Food item deleted successfully',
    });
  })
);

// POST /food-items/:id/events - Log food item event
router.post(
  '/:id/events',
  foodItemValidation.logEvent,
  validate,
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { id } = req.params;
    const eventData = req.body;

    const event = await FoodItemService.logFoodItemEvent(userId, id, eventData);

    res.status(201).json({
      message: 'Event logged successfully',
      event,
    });
  })
);

// GET /food-items/:id/events - Get event history
router.get(
  '/:id/events',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const events = await FoodItemService.getFoodItemEvents(userId, id);

    res.json({ events });
  })
);

export default router;

