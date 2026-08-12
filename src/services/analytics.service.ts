import { getAdminAnalytics } from '../repositories/analytics.repository.js';
import type { AdminAnalyticsOverview, AnalyticsRange } from '../types/analytics.types.js';
export const getAnalyticsOverview = (range: AnalyticsRange): Promise<AdminAnalyticsOverview> => getAdminAnalytics(range);
