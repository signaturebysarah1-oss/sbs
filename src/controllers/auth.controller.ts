import type { Response } from 'express';
import type { AuthenticatedRequest, MaybeAuthenticatedRequest } from '../types/api.types.js';
import { sendSuccess } from '../utils/response.js';

export function getMe(req: MaybeAuthenticatedRequest, res: Response): void {
  // req.user is guaranteed by requireAuth — assert non-null.
  const user = req.user as AuthenticatedRequest['user'];
  sendSuccess(res, 'Profile retrieved', user);
}
