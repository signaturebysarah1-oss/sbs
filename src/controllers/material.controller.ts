import type { Request, Response, NextFunction } from 'express';
import { getAllMaterials } from '../services/material.service.js';
import { sendSuccess } from '../utils/response.js';

export async function listMaterials(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const materials = await getAllMaterials();
    sendSuccess(res, 'Materials retrieved', materials);
  } catch (err) {
    next(err);
  }
}
