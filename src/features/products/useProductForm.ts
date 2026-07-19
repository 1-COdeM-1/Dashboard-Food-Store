import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema, type ProductFormValues } from '@/lib/schemas';
import type { Product, ProductInsert } from '@/types/product';
import { computeDiscountPercent, computeFinalPrice } from '@/lib/utils';
import {
  createProduct,
  deleteImagesFromStorage,
  updateProduct,
  uploadProductImage,
} from './api';

// Temp in-memory store for the pending new product ID so uploadImages
// (called before submit) can use the real folder name.
let pendingNewProductId: number | null = null;

const defaults: ProductFormValues = {
  title: '',
  titleAr: '',
  description: '',
  descriptionAr: '',
  price: 0,
  originalPrice: 0,
  category: '',
  categoryAr: '',
  featured: false,
  whatsNumber: '',
  rating: 0,
  reviews: 0,
  inStock: true,
  tags: [],
  images: [],
};

function toFormValues(product: Product): ProductFormValues {
  const salePrice = computeFinalPrice(product.price, product.discount);
  return {
    title: product.title,
    titleAr: product.titleAr,
    description: product.description,
    descriptionAr: product.descriptionAr,
    price: salePrice,
    originalPrice: product.price,
    category: product.category,
    categoryAr: product.categoryAr,
    featured: product.featured,
    whatsNumber: product.whatsNumber,
    rating: product.rating,
    reviews: product.reviews,
    inStock: product.inStock,
    tags: product.tags,
    images: product.images,
  };
}

function toDbPayload(values: ProductFormValues): ProductInsert {
  const { originalPrice, price: salePrice, ...rest } = values;
  return {
    ...rest,
    price: originalPrice,
    discount: computeDiscountPercent(originalPrice, salePrice),
  };
}

export function useProductForm(product?: Product | null) {
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: product ? toFormValues(product) : defaults,
    values: product ? toFormValues(product) : undefined,
  });

  const uploadImages = async (files: File[]) => {
    setUploading(true);
    try {
      // For edit: use the existing product ID.
      // For new: lazily create the DB record on first upload to get a real ID.
      let key: string;
      if (product) {
        key = String(product.id);
      } else {
        if (pendingNewProductId === null) {
          // Create a skeleton product to claim an ID
          const skeleton = await createProduct({
            title: '(draft)',
            titleAr: '',
            description: '',
            descriptionAr: '',
            price: 0,
            discount: 0,
            category: '',
            categoryAr: '',
            featured: false,
            whatsNumber: '',
            rating: 0,
            reviews: 0,
            inStock: true,
            tags: [],
            images: [],
          });
          pendingNewProductId = skeleton.id;
        }
        key = String(pendingNewProductId);
      }

      const urls: string[] = [];
      for (const file of files) {
        const url = await uploadProductImage(file, key);
        urls.push(url);
      }
      return urls;
    } finally {
      setUploading(false);
    }
  };

  const removeRemoteImage = async (url: string) => {
    await deleteImagesFromStorage([url]);
  };

  const submit = async (values: ProductFormValues) => {
    setSaving(true);
    try {
      const payload = toDbPayload(values);
      if (product) {
        // Edit: delete any removed images, then update
        const removed = product.images.filter((img) => !values.images.includes(img));
        if (removed.length > 0) {
          await deleteImagesFromStorage(removed);
        }
        return await updateProduct(product.id, payload);
      }

      // New product
      if (pendingNewProductId !== null) {
        // We already created a skeleton row; just update it with the real data
        const saved = await updateProduct(pendingNewProductId, payload);
        pendingNewProductId = null;
        return saved;
      }

      // No images were uploaded yet — create a fresh record
      const saved = await createProduct(payload);
      pendingNewProductId = null;
      return saved;
    } finally {
      setSaving(false);
    }
  };

  return {
    form,
    uploading,
    saving,
    uploadImages,
    removeRemoteImage,
    submit,
    isDirty: form.formState.isDirty,
  };
}
