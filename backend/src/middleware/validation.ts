import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const SENSITIVE_KEYS = new Set([
  'password',
  'code',
  'token',
  'refreshToken',
  'accessToken',
  'authorization',
]);

function redactSensitive(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(redactSensitive);

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
      key,
      SENSITIVE_KEYS.has(key) ? '[REDACTED]' : redactSensitive(nestedValue),
    ]),
  );
}

// Middleware to check validation results
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('[VALIDATION ERROR]', {
      path: req.path,
      method: req.method,
      body: redactSensitive(req.body),
      errors: errors.array()
    });
    res.status(400).json({ 
      error: 'Validation failed', 
      details: errors.array() 
    });
    return;
  }
  next();
};

// Common validation rules
export const authValidation = {
  register: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password')
      .isLength({ min: 10 }).withMessage('Password must be at least 10 characters')
      .matches(/[A-Za-z]/).withMessage('Password must include a letter')
      .matches(/\d/).withMessage('Password must include a number'),
    body('full_name').optional().trim().isLength({ min: 1, max: 255 }),
  ],
  login: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  refreshToken: [
    body('refreshToken').notEmpty().withMessage('Refresh token required'),
  ],
  forgotPassword: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  ],
  // Reset: either (token + password) for link flow, or (email + code + password) for in-app flow
  resetPassword: [
    body('password')
      .isLength({ min: 10 }).withMessage('Password must be at least 10 characters')
      .matches(/[A-Za-z]/).withMessage('Password must include a letter')
      .matches(/\d/).withMessage('Password must include a number'),
    body('token').optional().isString().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('code').optional().isString().trim().isLength({ min: 6, max: 6 }).withMessage('Code must be 6 digits'),
    body().custom((_, { req }) => {
      const hasToken = req.body.token && String(req.body.token).trim().length > 0;
      const hasEmailAndCode = req.body.email && req.body.code && String(req.body.code).trim().length === 6;
      if (hasToken || hasEmailAndCode) return true;
      throw new Error('Provide either token or both email and code');
    }),
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
    body('quantity').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1 }).withMessage('Quantity must be positive'),
    body('category_id').optional({ nullable: true, checkFalsy: true }).custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    }).withMessage('category_id must be a valid UUID or null'),
    body('location_id').optional({ nullable: true, checkFalsy: true }).custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
    }).withMessage('location_id must be a valid UUID or null'),
    body('expiry_date').optional({ nullable: true, checkFalsy: true }).custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      // Accept both date-only (YYYY-MM-DD) and full ISO8601 formats
      const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;
      return dateOnlyRegex.test(value) || iso8601Regex.test(value) || !isNaN(Date.parse(value));
    }).withMessage('expiry_date must be a valid date (YYYY-MM-DD or ISO8601)'),
    body('purchase_date').optional({ nullable: true, checkFalsy: true }).custom((value) => {
      if (value === null || value === undefined || value === '') return true;
      const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
      const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?(Z|[+-]\d{2}:\d{2})$/;
      return dateOnlyRegex.test(value) || iso8601Regex.test(value) || !isNaN(Date.parse(value));
    }).withMessage('purchase_date must be a valid date (YYYY-MM-DD or ISO8601)'),
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
