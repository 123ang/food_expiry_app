import { Router, Request, Response } from 'express';
import { LocationService } from '../services/locationService';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /locations - Get all locations
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { group_id } = req.query;

    const locations = await LocationService.getLocations(userId, group_id as string);

    res.json({ locations });
  })
);

// GET /locations/:id - Get location by ID
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { id } = req.params;

    const location = await LocationService.getLocationById(userId, id);

    res.json({ location });
  })
);

// POST /locations - Create custom location
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { group_id, name, icon, temperature_zone } = req.body;

    if (!group_id || !name) {
      res.status(400).json({ error: 'group_id and name are required' });
      return;
    }

    const location = await LocationService.createLocation(userId, group_id, { name, icon, temperature_zone });

    res.status(201).json({
      message: 'Location created successfully',
      location,
    });
  })
);

// PATCH /locations/:id - Update location
router.patch(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { id } = req.params;
    const updates = req.body;

    const location = await LocationService.updateLocation(userId, id, updates);

    res.json({
      message: 'Location updated successfully',
      location,
    });
  })
);

// DELETE /locations/:id - Delete location
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.userId;
    const { id } = req.params;

    await LocationService.deleteLocation(userId, id);

    res.json({
      message: 'Location deleted successfully',
    });
  })
);

export default router;

