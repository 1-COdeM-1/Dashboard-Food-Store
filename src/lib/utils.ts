import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number, locale = 'en'): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export function computeFinalPrice(price: number, discount: number): number {
  const clamped = Math.min(Math.max(discount, 0), 100);
  return Math.round(price * (1 - clamped / 100) * 100) / 100;
}

/** Discount % stored in DB from original (before offer) and sale price. */
export function computeDiscountPercent(originalPrice: number, salePrice: number): number {
  if (!Number.isFinite(originalPrice) || !Number.isFinite(salePrice) || originalPrice <= 0) {
    return 0;
  }
  if (salePrice >= originalPrice) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 10000) / 100;
}

export function parseStoragePathFromUrl(url: string): string | null {
  try {
    const marker = '/object/public/';
    const idx = url.indexOf(marker);
    if (idx === -1) return null;
    const after = url.slice(idx + marker.length);
    const slash = after.indexOf('/');
    if (slash === -1) return null;
    return decodeURIComponent(after.slice(slash + 1));
  } catch {
    return null;
  }
}
