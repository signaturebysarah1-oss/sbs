import type { Request, Response, NextFunction } from 'express';
import { getHomepageCarousel, getManagedHomepageCarousel, createManagedCarouselItem, updateManagedCarouselItem, removeManagedCarouselItem } from '../services/homepage.service.js';
import { createCarouselItemSchema, updateCarouselItemSchema } from '../validators/homepage.validator.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';
import { HttpStatus } from '../types/api.types.js';
export async function getCarousel(_req: Request, res: Response, next: NextFunction): Promise<void> { try { sendSuccess(res, 'Homepage carousel retrieved', await getHomepageCarousel()); } catch (error) { next(error); } }
export async function listAdminCarousel(_req: Request, res: Response, next: NextFunction): Promise<void> { try { sendSuccess(res, 'Carousel items retrieved', await getManagedHomepageCarousel()); } catch (error) { next(error); } }
export async function createCarousel(req: Request, res: Response, next: NextFunction): Promise<void> { try { const parsed = createCarouselItemSchema.safeParse(req.body); if (!parsed.success) throw AppError.badRequest(parsed.error.issues[0]?.message ?? 'Invalid request body'); sendSuccess(res, 'Carousel item created', await createManagedCarouselItem(parsed.data), HttpStatus.CREATED); } catch (error) { next(error); } }
export async function updateCarousel(req: Request, res: Response, next: NextFunction): Promise<void> { try { const parsed = updateCarouselItemSchema.safeParse(req.body); if (!parsed.success) throw AppError.badRequest(parsed.error.issues[0]?.message ?? 'Invalid request body'); sendSuccess(res, 'Carousel item updated', await updateManagedCarouselItem(req.params.id as string, parsed.data)); } catch (error) { next(error); } }
export async function deleteCarousel(req: Request, res: Response, next: NextFunction): Promise<void> { try { await removeManagedCarouselItem(req.params.id as string); sendSuccess(res, 'Carousel item deleted'); } catch (error) { next(error); } }
