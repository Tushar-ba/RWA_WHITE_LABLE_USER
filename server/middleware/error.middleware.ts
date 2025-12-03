import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  status?: number;
  statusCode?: number;
}

/**
 * Centralized error handling middleware
 * @param err - Error object
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal server error';

  console.error(`[ERROR] ${req.method} ${req.path}:`, {
    status,
    message,
    stack: err.stack,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // Don't expose internal errors in production
  const isProduction = process.env.NODE_ENV === 'production';
  const responseMessage = status === 500 && isProduction 
    ? 'Internal server error' 
    : message;

  res.status(status).json({
    message: responseMessage,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Async wrapper to catch errors in async route handlers
 * @param fn - Async function to wrap
 * @returns Wrapped function with error handling
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};