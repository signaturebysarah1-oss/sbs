import type { Request, Response, NextFunction } from 'express';
import { getAllColors } from '../services/color.service.js';
import { sendSuccess } from '../utils/response.js';

export async function listColors(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const colors = await getAllColors();
    sendSuccess(res, 'Colors retrieved', colors);
  } catch (err) {
    next(err);
  }
}
