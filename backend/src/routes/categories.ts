import { Router, Request, Response } from 'express';
import { CategoryService } from '../services/categoryService';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /categories - Get all categories
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { group_id } = req.query;

    const categories = await CategoryService.getCategories(userId, group_id as string);

    res.json({ categories });
  })
);

// GET /categories/:id - Get category by ID
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const category = await CategoryService.getCategoryById(userId, id);

    res.json({ category });
  })
);

// POST /categories - Create custom category
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { group_id, name, icon, color } = req.body;

    if (!group_id || !name) {
      return res.status(400).json({ error: 'group_id and name are required' });
    }

    const category = await CategoryService.createCategory(userId, group_id, { name, icon, color });

    res.status(201).json({
      message: 'Category created successfully',
      category,
    });
  })
);

// PATCH /categories/:id - Update category
router.patch(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;
    const updates = req.body;

    const category = await CategoryService.updateCategory(userId, id, updates);

    res.json({
      message: 'Category updated successfully',
      category,
    });
  })
);

// DELETE /categories/:id - Delete category
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { id } = req.params;

    await CategoryService.deleteCategory(userId, id);

    res.json({
      message: 'Category deleted successfully',
    });
  })
);

export default router;

