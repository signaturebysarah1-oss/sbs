export type CustomizationStatus = 'active' | 'inactive';

export interface CustomizationOption {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  imagePublicId: string | null;
  description: string | null;
  status: CustomizationStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CustomizationCategory {
  id: string;
  name: string;
  slug: string;
  status: CustomizationStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  options: CustomizationOption[];
}

export interface CreateCustomizationCategoryInput {
  name: string;
  slug: string;
  status?: CustomizationStatus;
  sortOrder?: number;
}
export type UpdateCustomizationCategoryInput = Partial<CreateCustomizationCategoryInput>;

export interface CreateCustomizationOptionInput {
  categoryId: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  description?: string | null;
  status?: CustomizationStatus;
  sortOrder?: number;
}
export type UpdateCustomizationOptionInput = Partial<Omit<CreateCustomizationOptionInput, 'categoryId'>> & { categoryId?: string };
