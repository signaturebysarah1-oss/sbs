import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError.js';
import { sendError } from '../utils/response.js';
import { HttpStatus } from '../types/api.types.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    sendError(res, err.message, {}, err.statusCode);
    return;
  }

  // Unexpected errors — hide details in production
  const message = env.isProduction ? 'Internal server error' : String(err);
  console.error('Unhandled error:', err);
  sendError(res, message, {}, HttpStatus.INTERNAL_SERVER_ERROR);
}
