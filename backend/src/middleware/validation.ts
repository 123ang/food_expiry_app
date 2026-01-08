import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Middleware to check validation results
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
  }
  next();
};

// Common validation rules
export const authValidation = {
  register: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('full_name').optional().trim().isLength({ min: 1, max: 255 }),
  ],
  login: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  refreshToken: [
    body('refreshToken').notEmpty().withMessage('Refresh token required'),
  ],
};

export const groupValidation = {
  create: [
    body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Group name required'),
    body('description').optional().trim().isLength({ max: 1000 }),
  ],
  update: [
    param('id').isUUID().withMessage('Valid group ID required'),
    body('name').optional().trim().isLength({ min: 1, max: 255 }),
    body('description').optional().trim().isLength({ max: 1000 }),
  ],
  invite: [
    param('id').isUUID().withMessage('Valid group ID required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  ],
  joinWithCode: [
    body('invite_code').trim().isLength({ min: 8, max: 12 }).withMessage('Valid invite code required'),
  ],
};

export const foodItemValidation = {
  create: [
    body('name').trim().isLength({ min: 1, max: 255 }).withMessage('Item name required'),
    body('group_id').isUUID().withMessage('Valid group ID required'),
    body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be positive'),
    body('category_id').optional().isUUID(),
    body('location_id').optional().isUUID(),
    body('expiry_date').optional().isISO8601().withMessage('Valid date required'),
    body('purchase_date').optional().isISO8601(),
  ],
  update: [
    param('id').isUUID().withMessage('Valid item ID required'),
    body('name').optional().trim().isLength({ min: 1, max: 255 }),
    body('quantity').optional().isInt({ min: 0 }),
  ],
  logEvent: [
    param('id').isUUID().withMessage('Valid item ID required'),
    body('event_type').isIn(['used_completely', 'used_partially', 'thrown_away', 'gifted', 'expired_unused']).withMessage('Valid event type required'),
    body('quantity_affected').optional().isInt({ min: 1 }),
    body('disposal_reason').optional().isIn(['expired', 'spoiled', 'too_much', 'dislike', 'forgotten', 'other']),
    body('price_at_disposal').optional().isFloat({ min: 0 }),
  ],
};

export const analyticsValidation = {
  summary: [
    query('group_id').isUUID().withMessage('Valid group ID required'),
    query('start_date').optional().isISO8601().withMessage('Valid start date required'),
    query('end_date').optional().isISO8601().withMessage('Valid end date required'),
    query('months').optional().isInt({ min: 1, max: 24 }).withMessage('Months must be between 1 and 24'),
  ],
};

