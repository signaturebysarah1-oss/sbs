import type { Request, Response, NextFunction } from 'express';
import * as service from '../services/customization.service.js';
import { createCustomizationCategorySchema, updateCustomizationCategorySchema, createCustomizationOptionSchema, updateCustomizationOptionSchema } from '../validators/customization.validator.js';
import { AppError } from '../utils/AppError.js';
import { sendSuccess } from '../utils/response.js';
import { HttpStatus } from '../types/api.types.js';
function body<T>(schema: { safeParse(value: unknown): { success: true; data: T } | { success: false; error: { issues: { message: string }[] } } }, value: unknown): T { const parsed = schema.safeParse(value); if (!parsed.success) throw AppError.badRequest(parsed.error.issues[0]?.message ?? 'Invalid request body'); return parsed.data; }
export async function listCustomizations(_req: Request, res: Response, next: NextFunction) { try { sendSuccess(res, 'Customization categories retrieved', await service.getPublicCustomizations()); } catch (error) { next(error); } }
export async function listAdminCustomizations(_req: Request, res: Response, next: NextFunction) { try { sendSuccess(res, 'Customization categories retrieved', await service.getManagedCustomizations()); } catch (error) { next(error); } }
export async function createCategory(req: Request, res: Response, next: NextFunction) { try { sendSuccess(res, 'Customization category created', await service.createManagedCustomizationCategory(body(createCustomizationCategorySchema, req.body)), HttpStatus.CREATED); } catch (error) { next(error); } }
export async function updateCategory(req: Request, res: Response, next: NextFunction) { try { sendSuccess(res, 'Customization category updated', await service.updateManagedCustomizationCategory(req.params.id as string, body(updateCustomizationCategorySchema, req.body))); } catch (error) { next(error); } }
export async function deleteCategory(req: Request, res: Response, next: NextFunction) { try { await service.removeManagedCustomizationCategory(req.params.id as string); sendSuccess(res, 'Customization category deleted'); } catch (error) { next(error); } }
export async function createOption(req: Request, res: Response, next: NextFunction) { try { sendSuccess(res, 'Customization option created', await service.createManagedCustomizationOption(body(createCustomizationOptionSchema, req.body)), HttpStatus.CREATED); } catch (error) { next(error); } }
export async function updateOption(req: Request, res: Response, next: NextFunction) { try { sendSuccess(res, 'Customization option updated', await service.updateManagedCustomizationOption(req.params.id as string, body(updateCustomizationOptionSchema, req.body))); } catch (error) { next(error); } }
export async function deleteOption(req: Request, res: Response, next: NextFunction) { try { await service.removeManagedCustomizationOption(req.params.id as string); sendSuccess(res, 'Customization option deleted'); } catch (error) { next(error); } }
