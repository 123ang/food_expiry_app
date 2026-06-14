import { Request, Response, NextFunction } from 'express';

// Custom error class
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler middleware
export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  console.error('❌ Error:', err);

  // Default error
  let statusCode = 500;
  let message = 'Internal server error';
  let isOperational = false;

  // Check if it's our custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    isOperational = err.isOperational;
  } else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  }

  const exposeDebugDetails = process.env.EXPOSE_ERROR_DETAILS === 'true';

  // Send error response
  res.status(statusCode).json({
    error: message,
    ...(exposeDebugDetails && {
      stack: err.stack,
    }),
  });

  // Log non-operational errors (unexpected errors)
  if (!isOperational) {
    console.error('💥 CRITICAL ERROR:', err);
    // In production, you might want to:
    // - Send to error tracking service (Sentry, etc.)
    // - Alert the team
    // - Restart the process if needed
  }
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path,
  });
};

// Async error wrapper to catch errors in async route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
