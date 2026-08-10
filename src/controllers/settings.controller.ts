import type { Request, Response, NextFunction } from 'express';
import { getAllSettings, patchSetting } from '../services/settings.service.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';
import { z } from 'zod';

const patchSettingSchema = z.object({
  value: z.union([z.string(), z.boolean()]).nullable().optional(),
  valueJson: z.unknown().optional(),
}).refine(
  (d) => d.value !== undefined || d.valueJson !== undefined,
  'value or valueJson must be provided',
);

const booleanSettingKeys = new Set([
  'notify_customer_on_quote', 'notify_admin_on_quote', 'notify_customer_on_cart', 'notify_admin_on_cart',
  'notify_customer_on_contact', 'notify_admin_on_contact', 'notify_customer_on_academy', 'notify_admin_on_academy',
  'notify_customer_on_order_status',
]);
const emailSettingKeys = new Set(['notification_email']);

function validateSettingValue(key: string, value: string | boolean | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (booleanSettingKeys.has(key)) {
    if (typeof value === 'boolean') return String(value);
    if (value === 'true' || value === 'false') return value;
    throw AppError.badRequest(`${key} must be a boolean`);
  }
  if (emailSettingKeys.has(key) && value !== null && !z.string().email().safeParse(value).success) {
    throw AppError.badRequest(`${key} must be a valid email address`);
  }
  if (key.endsWith('_url') && value !== null && !z.string().url().safeParse(value).success) {
    throw AppError.badRequest(`${key} must be a valid URL`);
  }
  if (typeof value === 'string' && value.length > 10_000) throw AppError.badRequest('value must not exceed 10000 characters');
  return value === null ? null : String(value);
}

export async function listSettings(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const settings = await getAllSettings();
    sendSuccess(res, 'Settings retrieved', settings);
  } catch (err) {
    next(err);
  }
}

export async function updateSetting(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const parsed = patchSettingSchema.safeParse(req.body);
    if (!parsed.success) {
      throw AppError.badRequest(parsed.error.issues[0]?.message ?? 'Invalid request body');
    }
    const setting = await patchSetting(req.params['key'] as string, validateSettingValue(req.params['key'] as string, parsed.data.value), parsed.data.valueJson);
    sendSuccess(res, 'Setting updated', setting);
  } catch (err) {
    next(err);
  }
}
