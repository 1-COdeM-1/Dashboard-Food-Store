import type { Product, ProductFilters, ProductInsert, ProductListResult, ProductUpdate } from '@/types/product';
import { STORAGE_BUCKET, supabase } from '@/lib/supabase';
import { parseStoragePathFromUrl } from '@/lib/utils';
import type { Database } from '@/types/database';
import imageCompression from 'browser-image-compression';

type ProductRow = Database['public']['Tables']['Products']['Row'];

function toNumber(value: string | number): number {
  return typeof value === 'number' ? value : Number(value);
}

export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    createdAt: row.createdAt,
    title: row.title,
    titleAr: row.titleAr,
    description: row.description,
    descriptionAr: row.descriptionAr,
    price: toNumber(row.price),
    discount: toNumber(row.discount),
    category: row.category,
    categoryAr: row.categoryAr,
    featured: row.featured,
    whatsNumber: row.whatsNumber,
    rating: toNumber(row.rating),
    reviews: toNumber(row.reviews),
    inStock: row.inStock,
    tags: row.tags ?? [],
    images: row.images ?? [],
  };
}

export async function fetchProducts(filters: ProductFilters = {}): Promise<ProductListResult> {
  const {
    search = '',
    category,
    inStock = null,
    featured = null,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    pageSize = 10,
  } = filters;

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase.from('Products').select('*', { count: 'exact' });

  if (search.trim()) {
    const term = `%${search.trim()}%`;
    query = query.or(`title.ilike."${term}",titleAr.ilike."${term}"`);
  }

  if (category) {
    query = query.eq('category', category);
  }

  if (inStock !== null && inStock !== undefined) {
    query = query.eq('inStock', inStock);
  }

  if (featured !== null && featured !== undefined) {
    query = query.eq('featured', featured);
  }

  query = query.order(sortBy, { ascending: sortOrder === 'asc' }).range(from, to);

  const { data, error, count } = await query;
  if (error) throw error;

  const total = count ?? 0;
  return {
    data: (data ?? []).map(mapProduct),
    count: total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function fetchProductById(id: number): Promise<Product> {
  const { data, error } = await supabase.from('Products').select('*').eq('id', id).single();
  if (error) throw error;
  return mapProduct(data);
}

export async function fetchCategories(): Promise<{ en: string; ar: string }[]> {
  const { data, error } = await supabase.from('Products').select('category, categoryAr');
  if (error) throw error;

  const map = new Map<string, { en: string; ar: string }>();
  for (const row of data ?? []) {
    if (row.category && !map.has(row.category)) {
      map.set(row.category, { en: row.category, ar: row.categoryAr });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.en.localeCompare(b.en));
}

export async function fetchOverviewStats() {
  const { data, error } = await supabase.from('Products').select('*');
  if (error) throw error;

  const products = (data ?? []).map(mapProduct);
  const inStock = products.filter((p) => p.inStock).length;
  const featured = products.filter((p) => p.featured).length;
  const avgRating =
    products.length === 0
      ? 0
      : Math.round((products.reduce((sum, p) => sum + p.rating, 0) / products.length) * 10) / 10;
  const totalReviews = products.reduce((sum, p) => sum + p.reviews, 0);

  const byCategory = Object.entries(
    products.reduce<Record<string, number>>((acc, p) => {
      acc[p.category] = (acc[p.category] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  const recent = [...products]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return {
    total: products.length,
    inStock,
    outOfStock: products.length - inStock,
    featured,
    avgRating,
    totalReviews,
    byCategory,
    recent,
  };
}

export async function duplicateProduct(product: Product): Promise<Product> {
  // 1. Create the new DB record first (no images yet) to get the real ID
  const payload: ProductInsert = {
    title: product.title,
    titleAr: product.titleAr,
    description: product.description,
    descriptionAr: product.descriptionAr,
    price: product.price,
    discount: product.discount,
    category: product.category,
    categoryAr: product.categoryAr,
    featured: product.featured,
    whatsNumber: product.whatsNumber,
    rating: product.rating,
    reviews: product.reviews,
    inStock: product.inStock,
    tags: product.tags,
    images: [],
  };
  const newProduct = await createProduct(payload);

  // 2. Copy each image into the new product's own folder
  if (product.images.length > 0) {
    const copiedUrls = await copyImagesToFolder(product.images, String(newProduct.id));
    await updateProduct(newProduct.id, { images: copiedUrls });
    return { ...newProduct, images: copiedUrls };
  }

  return newProduct;
}

export async function createProduct(payload: ProductInsert): Promise<Product> {
  const { data, error } = await supabase
    .from('Products')
    .insert({
      ...payload,
      price: payload.price,
      discount: payload.discount,
      rating: payload.rating,
      reviews: payload.reviews,
    })
    .select('*')
    .single();

  if (error) throw error;
  return mapProduct(data);
}

export async function updateProduct(id: number, payload: ProductUpdate): Promise<Product> {
  const { data, error } = await supabase
    .from('Products')
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) throw error;
  return mapProduct(data);
}

export async function deleteProduct(id: number): Promise<void> {
  // Delete all images in the product's folder, then delete the DB record
  await deleteProductFolder(String(id));
  const { error } = await supabase.from('Products').delete().eq('id', id);
  if (error) throw error;
}

/** Delete every file inside products/{folderName}/ in storage */
export async function deleteProductFolder(folderName: string): Promise<void> {
  const prefix = `products/${folderName}/`;

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return;

  // List all files in the folder (max 1000)
  const { data: files } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(`products/${folderName}`, { limit: 1000 });

  if (!files || files.length === 0) return;

  const paths = files
    .filter((f) => f.name !== '.emptyFolderPlaceholder')
    .map((f) => `${prefix}${f.name}`);

  if (paths.length === 0) return;
  await supabase.storage.from(STORAGE_BUCKET).remove(paths);
}

/**
 * Download each URL and re-upload it under products/{destFolder}/
 * Returns the new public URLs.
 */
export async function copyImagesToFolder(
  sourceUrls: string[],
  destFolder: string,
): Promise<string[]> {
  const results: string[] = [];
  for (const url of sourceUrls) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      const blob = await res.blob();
      const ext = url.split('.').pop()?.split('?')[0]?.toLowerCase() ?? 'jpg';
      const safeExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext) ? ext : 'jpg';
      const file = new File([blob], `${crypto.randomUUID()}.${safeExt}`, { type: blob.type });
      const newUrl = await uploadProductImage(file, destFolder);
      results.push(newUrl);
    } catch {
      // Skip images that fail to copy
    }
  }
  return results;
}

export async function uploadProductImage(file: File, productKey: string): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('You must be logged in to upload images');
  }

  let fileToUpload = file;
  try {
    const options = {
      maxSizeMB: 0.1,
      maxWidthOrHeight: 1000,
      useWebWorker: true,
      initialQuality: 0.8,
    };
    fileToUpload = await imageCompression(file, options);
  } catch (error) {
    console.error('Error compressing image:', error);
    // Proceed with original file if compression fails
  }

  const rawExt = fileToUpload.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const ext = ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(rawExt) ? rawExt : 'jpg';
  const path = `products/${productKey}/${crypto.randomUUID()}.${ext}`;
  const contentType = fileToUpload.type || `image/${ext === 'jpg' ? 'jpeg' : ext}`;

  const baseUrl = import.meta.env.VITE_SUPABASE_URL.replace(/\/$/, '');
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const uploadUrl = `${baseUrl}/storage/v1/object/${encodeURIComponent(STORAGE_BUCKET)}/${path}`;

  // Use the logged-in user's JWT so Storage RLS sees role = authenticated
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: anonKey,
      'Content-Type': contentType,
      'x-upsert': 'false',
      'cache-control': '3600',
    },
    body: fileToUpload,
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { message?: string } | null;
    const message = body?.message ?? 'Image upload failed';

    if (message.toLowerCase().includes('row-level security')) {
      throw new Error(
        'Storage RLS blocked this upload. Open Supabase → SQL Editor and run the script in supabase/storage-policies.sql',
      );
    }

    throw new Error(message);
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function deleteImagesFromStorage(urls: string[]): Promise<void> {
  const paths = urls
    .map(parseStoragePathFromUrl)
    .filter((p): p is string => Boolean(p));

  if (paths.length === 0) return;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error('You must be logged in to delete images');
  }

  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(paths);
  if (error) throw error;
}
