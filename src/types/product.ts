export interface Product {
  id: number;
  createdAt: string;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  price: number;
  discount: number;
  category: string;
  categoryAr: string;
  featured: boolean;
  whatsNumber: string;
  rating: number;
  reviews: number;
  inStock: boolean;
  tags: string[];
  images: string[];
}

export type ProductInsert = Omit<Product, 'id' | 'createdAt'>;
export type ProductUpdate = Partial<ProductInsert>;

export interface ProductFilters {
  search?: string;
  category?: string;
  inStock?: boolean | null;
  featured?: boolean | null;
  sortBy?: 'createdAt' | 'price' | 'rating' | 'title';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface ProductListResult {
  data: Product[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
