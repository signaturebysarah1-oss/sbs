import * as repository from '../repositories/homepage.repository.js';
import { AppError } from '../utils/AppError.js';
import type { CreateCarouselItemInput, UpdateCarouselItemInput } from '../types/homepage.types.js';
export const getHomepageCarousel = repository.findActiveCarouselItems;
export const getManagedHomepageCarousel = repository.findAllCarouselItems;
export const createManagedCarouselItem = repository.createCarouselItem;
export async function updateManagedCarouselItem(id: string, input: UpdateCarouselItemInput) { const item = await repository.updateCarouselItemById(id, input); if (!item) throw AppError.notFound('Carousel item not found'); return item; }
export async function removeManagedCarouselItem(id: string): Promise<void> { if (!await repository.deleteCarouselItemById(id)) throw AppError.notFound('Carousel item not found'); }
