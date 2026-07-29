import {
  createGalleryImage,
  deleteGalleryImageById,
  findPublishedGalleryImages,
} from '../repositories/gallery.repository.js';
import { AppError } from '../utils/AppError.js';
import type { CreateGalleryImageInput, GalleryImage } from '../types/gallery.types.js';

export async function getPublishedGalleryImages(): Promise<GalleryImage[]> {
  return findPublishedGalleryImages();
}

export async function createManagedGalleryImage(
  input: CreateGalleryImageInput,
): Promise<GalleryImage> {
  return createGalleryImage(input);
}

export async function removeManagedGalleryImage(id: string): Promise<void> {
  const deleted = await deleteGalleryImageById(id);
  if (!deleted) throw AppError.notFound('Gallery image not found');
}
