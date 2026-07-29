import { findActiveMaterials } from '../repositories/material.repository.js';
import type { Material } from '../types/catalog.types.js';

export async function getAllMaterials(): Promise<Material[]> {
  return findActiveMaterials();
}
