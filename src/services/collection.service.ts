import {
  findPublishedCollections,
  findCollectionBySlug,
  findProductIdsByCollectionSlug,
  buildCollectionWithProducts,
  findAllAdminCollections,
  createCollection,
  updateCollectionById,
  deleteCollectionById,
} from '../repositories/collection.repository.js';
import { findPublishedProductsByIds } from '../repositories/product.repository.js';
import { AppError } from '../utils/AppError.js';
import type { Collection, CollectionWithProducts } from '../types/catalog.types.js';
import type {
  AdminCollection,
  CreateCollectionInput,
  UpdateCollectionInput,
} from '../types/admin-catalog.types.js';

export async function getAllCollections(featured?: boolean): Promise<Collection[]> {
  return findPublishedCollections(featured);
}

export async function getCollectionBySlug(slug: string): Promise<CollectionWithProducts> {
  const collection = await findCollectionBySlug(slug);
  if (!collection) throw AppError.notFound(`Collection not found: ${slug}`);

  const productIds = await findProductIdsByCollectionSlug(slug);
  const products = await findPublishedProductsByIds(productIds);

  return buildCollectionWithProducts(collection, products);
}

export async function createManagedCollection(
  input: CreateCollectionInput,
): Promise<AdminCollection> {
  return createCollection(input);
}

export async function getManagedCollections(): Promise<AdminCollection[]> {
  return findAllAdminCollections();
}

export async function updateManagedCollection(
  id: string,
  input: UpdateCollectionInput,
): Promise<AdminCollection> {
  const collection = await updateCollectionById(id, input);
  if (!collection) throw AppError.notFound('Collection not found');
  return collection;
}

export async function removeManagedCollection(id: string): Promise<void> {
  const deleted = await deleteCollectionById(id);
  if (!deleted) throw AppError.notFound('Collection not found');
}
