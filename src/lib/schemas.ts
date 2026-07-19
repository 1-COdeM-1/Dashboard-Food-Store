import { z } from 'zod';

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const productSchema = z
  .object({
    title: z.string().min(1),
    titleAr: z.string().min(1),
    description: z.string().min(1),
    descriptionAr: z.string().min(1),
    /** Current selling / offer price */
    price: z.number().positive(),
    /** Price before the offer (original) */
    originalPrice: z.number().positive(),
    category: z.string().min(1),
    categoryAr: z.string().min(1),
    featured: z.boolean(),
    whatsNumber: z
      .string()
      .min(8)
      .regex(/^[+\d][\d\s-]{7,19}$/),
    rating: z.number().min(0).max(5),
    reviews: z.number().int().min(0),
    inStock: z.boolean(),
    tags: z.array(z.string().min(1)).min(1),
    images: z.array(z.url()).min(1),
  })
  .refine((data) => data.originalPrice >= data.price, {
    path: ['originalPrice'],
    message: 'originalPrice',
  });

export type ProductFormValues = z.infer<typeof productSchema>;
