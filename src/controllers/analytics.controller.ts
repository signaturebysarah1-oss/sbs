import type { Response, NextFunction } from 'express';
import type { MaybeAuthenticatedRequest } from '../types/api.types.js';
import { getAnalyticsOverview } from '../services/analytics.service.js';
import { sendSuccess } from '../utils/response.js';
import { AppError } from '../utils/AppError.js';
export async function getAdminAnalytics(req: MaybeAuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const from = typeof req.query['from'] === 'string' ? req.query['from'] : undefined;
    const to = typeof req.query['to'] === 'string' ? req.query['to'] : undefined;
    if ((from && !/^\d{4}-\d{2}-\d{2}$/.test(from)) || (to && !/^\d{4}-\d{2}-\d{2}$/.test(to))) throw AppError.badRequest('from and to must use YYYY-MM-DD');
    sendSuccess(res, 'Analytics retrieved', await getAnalyticsOverview({ from, to }));
  } catch (err) { next(err); }
}
