// ─── Primitives ───────────────────────────────────────────────────────────────

export interface ProductImage {
  id: string;
  imageUrl: string;
  imagePublicId: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface CollectionRef {
  id: string;
  name: string;
  slug: string;
}

export interface MaterialRef {
  id: string;
  name: string;
}

export interface ColorRef {
  id: string;
  name: string;
  hexCode: string | null;
}

export interface ProductVariant {
  id: string;
  sizeLabel: string | null;
  sizeValue: number | null;
  sku: string | null;
  priceAdjustment: number;
  isAvailable: boolean;
  sortOrder: number;
  color: ColorRef | null;
}

// ─── Product ──────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  basePrice: number;
  isCustomizable: boolean;
  isFeatured: boolean;
  isHero: boolean;
  sortOrder: number;
  metaTitle: string | null;
  metaDescription: string | null;
  images: ProductImage[];
  collections: CollectionRef[];
  materials: MaterialRef[];
  colors: ColorRef[];
  variants: ProductVariant[];
}

// List view — same as Product but variants omitted for performance
export type ProductSummary = Omit<Product, 'variants'>;

// ─── Collection ───────────────────────────────────────────────────────────────

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  imagePublicId: string | null;
  status: string;
  sortOrder: number;
  productCount: number;
}

export interface CollectionWithProducts extends Collection {
  products: ProductSummary[];
}

// ─── Material ─────────────────────────────────────────────────────────────────

export interface Material {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
}

// ─── Color ────────────────────────────────────────────────────────────────────

export interface Color {
  id: string;
  name: string;
  hexCode: string | null;
  imageUrl: string | null;
}
