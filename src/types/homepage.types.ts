export interface CarouselItem {
  id: string;
  imageUrl: string;
  imagePublicId: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCarouselItemInput {
  imageUrl: string;
  imagePublicId: string;
  sortOrder?: number;
  isActive?: boolean;
}

export type UpdateCarouselItemInput = Partial<CreateCarouselItemInput>;
