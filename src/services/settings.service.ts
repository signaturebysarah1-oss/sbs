import {
  findAllSettings,
  findSettingByKey,
  updateSettingByKey,
  type Setting,
} from '../repositories/settings.repository.js';
import { AppError } from '../utils/AppError.js';

export async function getAllSettings(): Promise<Setting[]> {
  return findAllSettings();
}

export async function patchSetting(
  key: string,
  value: string | null | undefined,
  valueJson?: unknown,
): Promise<Setting> {
  const updated = await updateSettingByKey(key, value, valueJson);
  if (!updated) throw AppError.notFound(`Setting not found: ${key}`);
  return updated;
}
