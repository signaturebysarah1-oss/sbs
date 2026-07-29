import type { Response, NextFunction } from 'express';
import type { MaybeAuthenticatedRequest } from '../types/api.types.js';
import { resolveUserFromToken } from '../services/auth.service.js';
import { AppError } from '../utils/AppError.js';

export async function requireAuth(
  req: MaybeAuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw AppError.unauthorized('Missing or malformed Authorization header');
    }

    const token = authHeader.slice(7); // strip "Bearer "

    req.user = await resolveUserFromToken(token);

    next();
  } catch (err) {
    next(err);
  }
}

// Resolves a user when a Bearer token is supplied, but allows unauthenticated
// requests to continue. Use this only on endpoints that explicitly support guests.
export async function optionalAuth(
  req: MaybeAuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      next();
      return;
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw AppError.unauthorized('Missing or malformed Authorization header');
    }

    req.user = await resolveUserFromToken(authHeader.slice(7));
    next();
  } catch (err) {
    next(err);
  }
}

// Role guard — use after requireAuth.
// Example: router.get('/admin', requireAuth, requireRole('admin'), handler)
export function requireRole(...roles: string[]) {
  return (req: MaybeAuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      next(AppError.forbidden('Insufficient permissions'));
      return;
    }
    next();
  };
}
