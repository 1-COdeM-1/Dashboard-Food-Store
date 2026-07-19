export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      Products: {
        Row: {
          id: number;
          createdAt: string;
          title: string;
          titleAr: string;
          description: string;
          descriptionAr: string;
          price: string | number;
          discount: string | number;
          category: string;
          categoryAr: string;
          featured: boolean;
          whatsNumber: string;
          rating: string | number;
          reviews: string | number;
          inStock: boolean;
          tags: string[];
          images: string[];
        };
        Insert: {
          id?: number;
          createdAt?: string;
          title: string;
          titleAr: string;
          description: string;
          descriptionAr: string;
          price: string | number;
          discount: string | number;
          category: string;
          categoryAr: string;
          featured?: boolean;
          whatsNumber: string;
          rating?: string | number;
          reviews?: string | number;
          inStock?: boolean;
          tags: string[];
          images: string[];
        };
        Update: {
          id?: number;
          createdAt?: string;
          title?: string;
          titleAr?: string;
          description?: string;
          descriptionAr?: string;
          price?: string | number;
          discount?: string | number;
          category?: string;
          categoryAr?: string;
          featured?: boolean;
          whatsNumber?: string;
          rating?: string | number;
          reviews?: string | number;
          inStock?: boolean;
          tags?: string[];
          images?: string[];
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
