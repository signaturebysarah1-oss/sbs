import * as repository from '../repositories/customization.repository.js';
import { AppError } from '../utils/AppError.js';
import type { CreateCustomizationCategoryInput, UpdateCustomizationCategoryInput, CreateCustomizationOptionInput, UpdateCustomizationOptionInput } from '../types/customization.types.js';
export const getPublicCustomizations = () => repository.findCustomizationCategories(true);
export const getManagedCustomizations = () => repository.findCustomizationCategories(false);
export const createManagedCustomizationCategory = repository.createCategory;
export async function updateManagedCustomizationCategory(id: string, input: UpdateCustomizationCategoryInput) { const value = await repository.updateCategory(id, input); if (!value) throw AppError.notFound('Customization category not found'); return value; }
export async function removeManagedCustomizationCategory(id: string) { if (!await repository.deleteCategory(id)) throw AppError.notFound('Customization category not found'); }
export async function createManagedCustomizationOption(input: CreateCustomizationOptionInput) { const value = await repository.createOption(input); if (!value) throw AppError.notFound('Customization category not found'); return value; }
export async function updateManagedCustomizationOption(id: string, input: UpdateCustomizationOptionInput) { const value = await repository.updateOption(id, input); if (!value) throw AppError.notFound('Customization option not found'); return value; }
export async function removeManagedCustomizationOption(id: string) { if (!await repository.deleteOption(id)) throw AppError.notFound('Customization option not found'); }
