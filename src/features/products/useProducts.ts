import { useEffect, useState } from 'react';
import type { Product, ProductFilters, ProductListResult } from '@/types/product';
import {
  deleteProduct,
  fetchCategories,
  fetchProductById,
  fetchProducts,
  updateProduct,
} from './api';

export function useProducts(initial?: ProductFilters) {
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    search: '',
    category: '',
    inStock: null,
    featured: null,
    ...initial,
  });
  const [result, setResult] = useState<ProductListResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await fetchProducts(filters);
        if (cancelled) return;
        setResult(data);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load products');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    filters,
    reloadToken,
  ]);

  const updateFilters = (patch: Partial<ProductFilters>) => {
    setLoading(true);
    setFilters((prev) => ({
      ...prev,
      ...patch,
      page:
        patch.page ??
        (patch.search !== undefined ||
        patch.category !== undefined ||
        patch.inStock !== undefined ||
        patch.featured !== undefined ||
        patch.sortBy !== undefined ||
        patch.sortOrder !== undefined
          ? 1
          : prev.page),
    }));
  };

  const reload = () => {
    setLoading(true);
    setReloadToken((n) => n + 1);
  };

  const remove = async (product: Product) => {
    await deleteProduct(product.id);
    reload();
  };

  const toggleStock = async (product: Product) => {
    await updateProduct(product.id, { inStock: !product.inStock });
    reload();
  };

  return {
    filters,
    updateFilters,
    result,
    loading,
    error,
    reload,
    remove,
    toggleStock,
  };
}

export function useProduct(id?: number) {
  const [state, setState] = useState<{
    product: Product | null;
    error: string | null;
    fetchedId?: number;
  }>({
    product: null,
    error: null,
    fetchedId: undefined,
  });

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    void (async () => {
      try {
        const data = await fetchProductById(id);
        if (cancelled) return;
        setState({ product: data, error: null, fetchedId: id });
      } catch (err: unknown) {
        if (cancelled) return;
        setState({
          product: null,
          error: err instanceof Error ? err.message : 'Failed to load product',
          fetchedId: id,
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) {
    return { product: null, loading: false, error: null };
  }

  const loading = state.fetchedId !== id;
  return {
    product: loading ? null : state.product,
    loading,
    error: loading ? null : state.error,
  };
}

export function useCategories() {
  const [categories, setCategories] = useState<{ en: string; ar: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await fetchCategories();
        if (cancelled) return;
        setCategories(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { categories, loading, setCategories };
}
