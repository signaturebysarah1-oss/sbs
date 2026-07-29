import type { ProductSummary } from './catalog.types.js';

export interface Favorite {
  id: string;
  productId: string;
  createdAt: string;
  product: ProductSummary;
}
