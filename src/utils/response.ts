import type { Response } from 'express';
import { HttpStatus, type ApiSuccess, type ApiError, type HttpStatusCode } from '../types/api.types.js';

export function sendSuccess<T>(
  res: Response,
  message: string,
  data: T = {} as T,
  statusCode: HttpStatusCode = HttpStatus.OK,
): void {
  const body: ApiSuccess<T> = { success: true, message, data };
  res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  message: string,
  error: Record<string, unknown> = {},
  statusCode: HttpStatusCode = HttpStatus.INTERNAL_SERVER_ERROR,
): void {
  const body: ApiError = { success: false, message, error };
  res.status(statusCode).json(body);
}
