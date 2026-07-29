import { findActiveColors } from '../repositories/color.repository.js';
import type { Color } from '../types/catalog.types.js';

export async function getAllColors(): Promise<Color[]> {
  return findActiveColors();
}
