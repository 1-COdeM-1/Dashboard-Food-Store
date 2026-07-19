import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PackagePlus, Search } from 'lucide-react';
import { useCategories, useProducts } from '@/features/products/useProducts';
import { deleteProduct, updateProduct, duplicateProduct } from '@/features/products/api';
import { useToast } from '@/features/toast/useToast';
import type { Product } from '@/types/product';
import { ProductTable } from '@/components/products/ProductTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

export function ProductsPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { categories } = useCategories();
  const { filters, updateFilters, result, loading, error, reload, remove } = useProducts();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchDraft, setSearchDraft] = useState(filters.search ?? '');
  const searchTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimerRef.current !== null) {
        window.clearTimeout(searchTimerRef.current);
      }
    };
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchDraft(value);
    if (searchTimerRef.current !== null) {
      window.clearTimeout(searchTimerRef.current);
    }
    searchTimerRef.current = window.setTimeout(() => {
      updateFilters({ search: value });
    }, 300);
  };

  const products = result?.data ?? [];

  const categoryOptions = useMemo(
    () => [
      { value: '', label: t('common.all') },
      ...categories.map((c) => ({ value: c.en, label: c.en })),
    ],
    [categories, t],
  );

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (products.every((p) => selectedIds.includes(p.id))) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map((p) => p.id));
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await remove(pendingDelete);
      toast.success(t('toast.success'), t('products.deleted'));
      setSelectedIds((ids) => ids.filter((id) => id !== pendingDelete.id));
      setPendingDelete(null);
    } catch {
      toast.error(t('toast.error'), t('products.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  const bulkDelete = async () => {
    setBulkDeleting(true);
    try {
      const selected = products.filter((p) => selectedIds.includes(p.id));
      for (const product of selected) {
        await deleteProduct(product.id);
      }
      setSelectedIds([]);
      await reload();
      toast.success(t('toast.success'), t('products.deleted'));
    } catch {
      toast.error(t('toast.error'), t('products.deleteFailed'));
    } finally {
      setBulkDeleting(false);
    }
  };

  const bulkToggleStock = async () => {
    try {
      const selected = products.filter((p) => selectedIds.includes(p.id));
      for (const product of selected) {
        await updateProduct(product.id, { inStock: !product.inStock });
      }
      setSelectedIds([]);
      await reload();
      toast.success(t('toast.success'), t('products.updated'));
    } catch {
      toast.error(t('toast.error'), t('products.updateFailed'));
    }
  };

  const handleDuplicate = async (product: Product) => {
    try {
      await duplicateProduct(product);
      await reload();
      toast.success(t('toast.success'), t('products.duplicated'));
    } catch {
      toast.error(t('toast.error'), t('products.duplicateFailed'));
    }
  };

  return (
    <div className="w-full max-w-full space-y-6 overflow-x-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{t('products.title')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('products.subtitle')}</p>
        </div>
        <Link to="/dashboard/products/new" className="shrink-0">
          <Button className="w-full sm:w-auto">
            <PackagePlus className="size-4" />
            {t('products.addProduct')}
          </Button>
        </Link>
      </div>

      <div className="flex w-full max-w-full flex-col gap-3 overflow-hidden rounded-xl border border-border bg-surface p-3 shadow-sm sm:p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative min-w-0 sm:col-span-2">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="ps-9"
              placeholder={t('products.searchPlaceholder')}
              value={searchDraft}
              onChange={(e) => handleSearchChange(e.target.value)}
              aria-label={t('common.search')}
            />
          </div>
          <Select
            options={categoryOptions}
            value={filters.category ?? ''}
            onChange={(e) => updateFilters({ category: e.target.value })}
            aria-label={t('products.filterCategory')}
          />
          <Select
            options={[
              { value: 'createdAt:desc', label: `${t('products.sortCreatedAt')} ↓` },
              { value: 'createdAt:asc', label: `${t('products.sortCreatedAt')} ↑` },
              { value: 'price:desc', label: `${t('products.sortPrice')} ↓` },
              { value: 'price:asc', label: `${t('products.sortPrice')} ↑` },
              { value: 'rating:desc', label: `${t('products.sortRating')} ↓` },
              { value: 'rating:asc', label: `${t('products.sortRating')} ↑` },
              { value: 'title:asc', label: `${t('products.sortTitle')} ↑` },
              { value: 'title:desc', label: `${t('products.sortTitle')} ↓` },
            ]}
            value={`${filters.sortBy}:${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split(':') as [
                'createdAt' | 'price' | 'rating' | 'title',
                'asc' | 'desc',
              ];
              updateFilters({ sortBy, sortOrder });
            }}
          />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center">
          <Select
            className="w-full lg:w-auto lg:min-w-40"
            options={[
              { value: '', label: t('products.filterStock') },
              { value: 'true', label: t('products.inStock') },
              { value: 'false', label: t('products.outOfStock') },
            ]}
            value={
              filters.inStock === null || filters.inStock === undefined
                ? ''
                : String(filters.inStock)
            }
            onChange={(e) =>
              updateFilters({
                inStock: e.target.value === '' ? null : e.target.value === 'true',
              })
            }
          />
          <Select
            className="w-full lg:w-auto lg:min-w-40"
            options={[
              { value: '', label: t('products.filterFeatured') },
              { value: 'true', label: t('common.yes') },
              { value: 'false', label: t('common.no') },
            ]}
            value={
              filters.featured === null || filters.featured === undefined
                ? ''
                : String(filters.featured)
            }
            onChange={(e) =>
              updateFilters({
                featured: e.target.value === '' ? null : e.target.value === 'true',
              })
            }
          />
          {selectedIds.length > 0 ? (
            <div className="col-span-full flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
              <span className="text-sm text-muted-foreground">
                {selectedIds.length} {t('common.selected')}
              </span>
              <Button size="sm" variant="outline" className="w-full sm:w-auto" onClick={() => void bulkToggleStock()}>
                {t('products.bulkToggleStock')}
              </Button>
              <Button
                size="sm"
                variant="danger"
                className="w-full sm:w-auto"
                loading={bulkDeleting}
                onClick={() => void bulkDelete()}
              >
                {t('products.bulkDelete')}
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {loading ? <TableSkeleton /> : null}

      {!loading && error ? (
        <EmptyState
          title={t('products.loadFailed')}
          description={error}
          action={<Button onClick={() => void reload()}>{t('common.retry')}</Button>}
        />
      ) : null}

      {!loading && !error && products.length === 0 ? (
        <EmptyState
          title={t('products.emptyTitle')}
          description={t('products.emptyDescription')}
          action={
            <Link to="/dashboard/products/new">
              <Button>{t('products.addProduct')}</Button>
            </Link>
          }
        />
      ) : null}

      {!loading && !error && products.length > 0 ? (
        <>
          <ProductTable
            products={products}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onDelete={setPendingDelete}
            onDuplicate={(p) => void handleDuplicate(p)}
          />
          {result ? (
            <Pagination
              page={result.page}
              totalPages={result.totalPages}
              total={result.count}
              pageSize={result.pageSize}
              onPageChange={(page) => updateFilters({ page })}
            />
          ) : null}
        </>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => void confirmDelete()}
        title={t('products.deleteTitle')}
        description={t('products.deleteDescription')}
        loading={deleting}
        confirmLabel={t('common.delete')}
      />
    </div>
  );
}
