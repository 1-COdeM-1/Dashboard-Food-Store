import { Controller } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { UseFormReturn } from 'react-hook-form';
import type { ProductFormValues } from '@/lib/schemas';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { TagInput } from '@/components/ui/TagInput';
import { ImageDropzone } from '@/components/ui/ImageDropzone';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';

export interface ProductFormProps {
  form: UseFormReturn<ProductFormValues>;
  categories: { en: string; ar: string }[];
  uploading: boolean;
  saving: boolean;
  onUpload: (files: File[]) => Promise<string[]>;
  onRemoveRemote: (url: string) => Promise<void>;
  onSubmit: (values: ProductFormValues) => Promise<void>;
  title: string;
}

export function ProductForm({
  form,
  categories,
  uploading,
  saving,
  onUpload,
  onRemoveRemote,
  onSubmit,
  title,
}: ProductFormProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [customCategory, setCustomCategory] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const price = watch('price') || 0;
  const originalPrice = watch('originalPrice') || 0;
  const hasOffer = Number(originalPrice) > Number(price) && Number(price) > 0;
  const savingsPercent =
    hasOffer && Number(originalPrice) > 0
      ? Math.round(((Number(originalPrice) - Number(price)) / Number(originalPrice)) * 100)
      : 0;

  const categoryOptions = [
    ...categories.map((c) => ({ value: c.en, label: c.en })),
    { value: '__new__', label: t('products.addCategory') },
  ];

  return (
    <form
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values);
      })}
      className="space-y-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('products.subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(-1)}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" loading={saving}>
            {saving ? t('products.saving') : t('products.publish')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('products.englishFields')}
          </h2>
          <Input
            label={t('products.titleEn')}
            dir="ltr"
            error={errors.title?.message ? t('validation.required') : undefined}
            {...register('title')}
          />
          <Textarea
            label={t('products.descriptionEn')}
            dir="ltr"
            error={errors.description?.message ? t('validation.required') : undefined}
            {...register('description')}
          />
          {!customCategory ? (
            <Select
              label={t('products.categoryEn')}
              options={categoryOptions}
              placeholder={t('products.selectCategory')}
              error={errors.category?.message ? t('validation.required') : undefined}
              value={watch('category') || ''}
              onChange={(e) => {
                if (e.target.value === '__new__') {
                  setCustomCategory(true);
                  setValue('category', '', { shouldDirty: true });
                  return;
                }
                const match = categories.find((c) => c.en === e.target.value);
                setValue('category', e.target.value, { shouldDirty: true, shouldValidate: true });
                if (match) {
                  setValue('categoryAr', match.ar, { shouldDirty: true, shouldValidate: true });
                }
              }}
            />
          ) : (
            <Input
              label={t('products.categoryEn')}
              dir="ltr"
              error={errors.category?.message ? t('validation.required') : undefined}
              {...register('category')}
            />
          )}
        </Card>

        <Card className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('products.arabicFields')}
          </h2>
          <Input
            label={t('products.titleAr')}
            dir="rtl"
            error={errors.titleAr?.message ? t('validation.required') : undefined}
            {...register('titleAr')}
          />
          <Textarea
            label={t('products.descriptionAr')}
            dir="rtl"
            error={errors.descriptionAr?.message ? t('validation.required') : undefined}
            {...register('descriptionAr')}
          />
          <Input
            label={t('products.categoryAr')}
            dir="rtl"
            error={errors.categoryAr?.message ? t('validation.required') : undefined}
            {...register('categoryAr')}
          />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('products.priceLabel')}
              type="number"
              step="0.01"
              min="0"
              error={errors.price?.message ? t('validation.positivePrice') : undefined}
              {...register('price', { valueAsNumber: true })}
            />
            <Input
              label={t('products.originalPriceLabel')}
              type="number"
              step="0.01"
              min="0"
              error={
                errors.originalPrice?.message
                  ? errors.originalPrice.message === 'originalPrice'
                    ? t('validation.originalPrice')
                    : t('validation.positivePrice')
                  : undefined
              }
              {...register('originalPrice', { valueAsNumber: true })}
            />
          </div>
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3">
            <p className="text-xs text-muted-foreground">{t('products.finalPrice')}</p>
            <p className="text-xl font-semibold text-foreground">
              {formatCurrency(Number(price) || 0, i18n.language)}
            </p>
            {hasOffer ? (
              <p className="text-xs text-success">
                {t('products.discountOff', { value: savingsPercent })} · {t('products.originalPrice')}{' '}
                <span className="line-through">
                  {formatCurrency(Number(originalPrice), i18n.language)}
                </span>
              </p>
            ) : null}
          </div>
          <Input
            label={t('products.whatsNumber')}
            error={errors.whatsNumber?.message ? t('validation.phone') : undefined}
            {...register('whatsNumber')}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label={t('products.ratingLabel')}
              type="number"
              step="0.1"
              min="0"
              max="5"
              error={errors.rating?.message ? t('validation.ratingRange') : undefined}
              {...register('rating', { valueAsNumber: true })}
            />
            <Input
              label={t('products.reviewsLabel')}
              type="number"
              min="0"
              step="1"
              {...register('reviews', { valueAsNumber: true })}
            />
          </div>
          <div className="flex flex-wrap gap-6 pt-2">
            <Controller
              control={control}
              name="featured"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onChange={field.onChange}
                  label={t('products.featuredLabel')}
                />
              )}
            />
            <Controller
              control={control}
              name="inStock"
              render={({ field }) => (
                <Switch
                  checked={field.value}
                  onChange={field.onChange}
                  label={t('products.inStockLabel')}
                />
              )}
            />
          </div>
        </Card>

        <Card className="space-y-4">
          <Controller
            control={control}
            name="tags"
            render={({ field }) => (
              <TagInput
                label={t('products.tags')}
                value={field.value}
                onChange={field.onChange}
                error={errors.tags?.message ? t('validation.minTags') : undefined}
              />
            )}
          />
          <div>
            <p className="mb-1.5 text-sm font-medium text-foreground">{t('products.images')}</p>
            <Controller
              control={control}
              name="images"
              render={({ field }) => (
                <ImageDropzone
                  images={field.value}
                  onChange={field.onChange}
                  onUpload={onUpload}
                  onRemoveRemote={onRemoveRemote}
                  uploading={uploading}
                  error={errors.images?.message ? t('validation.minImages') : undefined}
                />
              )}
            />
          </div>
        </Card>
      </div>
    </form>
  );
}
