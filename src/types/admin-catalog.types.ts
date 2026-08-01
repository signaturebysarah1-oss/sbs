import type { ProductImage } from './catalog.types.js';

export type CatalogStatus = 'draft' | 'published' | 'archived';

export interface CreateProductInput {
  name: string;
  slug: string;
  description: string | null;
  category?: string | null;
  gender?: 'male' | 'female' | 'unisex' | null;
  basePrice: number;
  isCustomizable: boolean;
  status: CatalogStatus;
  isFeatured: boolean;
  isHero: boolean;
}

export type UpdateProductInput = Partial<CreateProductInput>;

export interface AdminProduct extends CreateProductInput {
  category: string | null;
  gender: 'male' | 'female' | 'unisex' | null;
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductImageInput {
  imageUrl: string;
  imagePublicId: string;
  altText?: string | null;
  sortOrder?: number;
  isPrimary?: boolean;
}

export interface CreateCollectionInput {
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  imagePublicId?: string | null;
  status: CatalogStatus;
  isFeatured: boolean;
  sortOrder?: number;
}

export type UpdateCollectionInput = Partial<CreateCollectionInput>;

export interface AdminCollection extends CreateCollectionInput {
  id: string;
  productCount: number;
  createdAt: string;
  updatedAt: string;
}

export type ManagedProductImage = ProductImage;

export interface ProductCollectionAssignmentInput {
  collectionId: string;
}

export interface CreateProductVariantInput {
  sizeLabel?: string | null;
  sizeValue?: number | null;
  sku?: string | null;
  priceAdjustment?: number;
  colorId?: string | null;
  isAvailable?: boolean;
  sortOrder?: number;
}

export type UpdateProductVariantInput = CreateProductVariantInput;

export interface ManagedProductVariant {
  id: string;
  productId: string;
  colorId: string | null;
  sizeLabel: string | null;
  sizeValue: number | null;
  sku: string | null;
  priceAdjustment: number;
  isAvailable: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}
