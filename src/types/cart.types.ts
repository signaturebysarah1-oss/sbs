export const CART_STATUSES = ['active', 'submitted', 'abandoned'] as const;
export type CartStatus = (typeof CART_STATUSES)[number];

export interface CartItem {
  id: string;
  cartId: string;
  productId: string | null;
  productNameSnapshot: string | null;
  imageUrlSnapshot: string | null;
  quantity: number;
  selectedSize: number | null;
  selectedColor: string | null;
  selectedMaterial: string | null;
  unitPriceSnapshot: number;
  createdAt: string;
  updatedAt: string;
}

export interface Cart {
  id: string;
  profileId: string;
  status: CartStatus;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CartHistoryItem {
  productId: string | null;
  productNameSnapshot: string | null;
  imageUrlSnapshot: string | null;
  quantity: number;
  selectedSize: number | null;
  selectedColor: string | null;
  selectedMaterial: string | null;
  unitPriceSnapshot: number;
}

export interface CartHistory {
  id: string;
  originalCartId: string | null;
  profileId: string;
  items: CartHistoryItem[];
  totalSnapshot: number;
  completedAt: string;
  createdAt: string;
}

export interface AddCartItemInput {
  productId?: string | null;
  productNameSnapshot?: string | null;
  imageUrlSnapshot?: string | null;
  quantity: number;
  selectedSize?: number | null;
  selectedColor?: string | null;
  selectedMaterial?: string | null;
  unitPriceSnapshot: number;
}

export interface UpdateCartItemInput {
  quantity?: number;
  selectedSize?: number | null;
  selectedColor?: string | null;
  selectedMaterial?: string | null;
}

export interface CartSubmitResult {
  submittedCartId: string;
  historyId: string;
  newActiveCartId: string;
}

export interface CartSubmitInput {
  contactMethod: 'email' | 'whatsapp';
  phoneNumber?: string | null;
}
