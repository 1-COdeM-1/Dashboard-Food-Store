import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProduct, useCategories } from '@/features/products/useProducts';
import { useProductForm } from '@/features/products/useProductForm';
import { useToast } from '@/features/toast/useToast';
import { ProductForm } from '@/components/products/ProductForm';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import type { ProductFormValues } from '@/lib/schemas';

export function ProductFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const productId = id ? Number(id) : undefined;
  const { t } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const { product, loading, error } = useProduct(productId);
  const { categories, setCategories } = useCategories();
  const { form, uploading, saving, uploadImages, removeRemoteImage, submit, isDirty } =
    useProductForm(isEdit ? product : null);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  if (isEdit && loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (isEdit && (error || !product)) {
    return (
      <EmptyState
        title={t('products.loadFailed')}
        description={error ?? undefined}
        action={
          <Button onClick={() => navigate('/dashboard/products')}>{t('common.back')}</Button>
        }
      />
    );
  }

  const onSubmit = async (values: ProductFormValues) => {
    try {
      const saved = await submit(values);
      if (!categories.some((c) => c.en === values.category)) {
        setCategories((prev) => [...prev, { en: values.category, ar: values.categoryAr }]);
      }
      toast.success(
        t('toast.success'),
        isEdit ? t('products.updated') : t('products.created'),
      );
      navigate(`/dashboard/products/${saved.id}`);
    } catch {
      toast.error(
        t('toast.error'),
        isEdit ? t('products.updateFailed') : t('products.createFailed'),
      );
    }
  };

  return (
    <ProductForm
      form={form}
      categories={categories}
      uploading={uploading}
      saving={saving}
      onUpload={async (files) => {
        try {
          return await uploadImages(files);
        } catch (err) {
          const message =
            err instanceof Error && err.message
              ? err.message
              : t('products.uploadFailed');
          toast.error(t('toast.error'), message);
          return [];
        }
      }}
      onRemoveRemote={removeRemoteImage}
      onSubmit={onSubmit}
      title={isEdit ? t('products.editProduct') : t('products.addProduct')}
    />
  );
}
