import type { ProductImage } from './catalog.types.js';

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  basePrice: number;
  images: ProductImage[];
}

export interface CartVariant {
  id: string;
  sizeLabel: string | null;
  sizeValue: number | null;
  sku: string | null;
  priceAdjustment: number;
}

export interface CartItem {
  id: string;
  quantity: number;
  unitPriceSnapshot: number;
  createdAt: string;
  updatedAt: string;
  product: CartProduct;
  variant: CartVariant | null;
}

export interface Cart {
  id: string;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
}

export interface AddCartItemInput {
  productId: string;
  variantId?: string | null;
  quantity: number;
}
