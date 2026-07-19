import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, ChevronLeft, ChevronRight, X, Copy } from 'lucide-react';
import { useState } from 'react';
import { useProduct } from '@/features/products/useProducts';
import { deleteProduct, duplicateProduct } from '@/features/products/api';
import { useToast } from '@/features/toast/useToast';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { StarRating } from '@/components/ui/StarRating';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { computeFinalPrice, formatCurrency } from '@/lib/utils';

export function ProductDetailPage() {
  const { id } = useParams();
  const productId = Number(id);
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const toast = useToast();
  const { product, loading, error } = useProduct(productId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const allImages = product?.images ?? [];
  const activeImage = allImages[activeIndex] ?? '';

  const handleThumbnailClick = (idx: number) => {
    setActiveIndex(idx);
    setIsZoomed(false);
  };

  const handleMainImageClick = () => {
    setIsZoomed((prev) => !prev);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((i) => (i - 1 + allImages.length) % allImages.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex((i) => (i + 1) % allImages.length);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (error || !product) {
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

  const finalPrice = computeFinalPrice(product.price, product.discount);

  const handleDuplicate = async () => {
    if (!product) return;
    setDuplicating(true);
    try {
      const copy = await duplicateProduct(product);
      toast.success(t('toast.success'), t('products.duplicated'));
      navigate(`/dashboard/products/${copy.id}`);
    } catch {
      toast.error(t('toast.error'), t('products.duplicateFailed'));
    } finally {
      setDuplicating(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteProduct(product.id);
      toast.success(t('toast.success'), t('products.deleted'));
      navigate('/dashboard/products');
    } catch {
      toast.error(t('toast.error'), t('products.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t('products.productDetails')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">#{product.id}</p>
        </div>
        <div className="flex gap-2">
          <Link to={`/dashboard/products/${product.id}/edit`}>
            <Button variant="outline">
              <Pencil className="size-4" />
              {t('common.edit')}
            </Button>
          </Link>
          <Button
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/10"
            loading={duplicating}
            onClick={() => void handleDuplicate()}
          >
            <Copy className="size-4" />
            {t('products.duplicate')}
          </Button>
          <Button variant="danger" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="size-4" />
            {t('common.delete')}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-3">
          {/* Main Image */}
          <div
            className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-muted"
          >
            {activeImage ? (
              <>
                <img
                  src={activeImage}
                  alt=""
                  onClick={handleMainImageClick}
                  className={[
                    'size-full object-cover select-none transition-transform duration-500 ease-in-out',
                    isZoomed
                      ? 'scale-125 cursor-zoom-out'
                      : 'scale-100 cursor-zoom-in hover:scale-105',
                  ].join(' ')}
                  style={{ transformOrigin: 'center center' }}
                />

                {/* Close zoom button */}
                {isZoomed && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsZoomed(false); }}
                    className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-all hover:bg-black/70"
                    aria-label="Close zoom"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                {/* Prev / Next arrows — appear on hover/touch, visible when multiple images */}
                {allImages.length > 1 && (
                  <>
                    <button
                      onClick={handlePrev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100 hover:bg-black/70 hover:scale-110 active:scale-95"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={handleNext}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-all duration-200 opacity-0 group-hover:opacity-100 hover:bg-black/70 hover:scale-110 active:scale-95"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}

                {/* Dot indicators */}
                {allImages.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {allImages.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); handleThumbnailClick(idx); }}
                        className={[
                          'h-2 rounded-full transition-all duration-300',
                          activeIndex === idx
                            ? 'w-6 bg-white shadow'
                            : 'w-2 bg-white/50 hover:bg-white/80',
                        ].join(' ')}
                        aria-label={`Go to image ${idx + 1}`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Thumbnails */}
          {allImages.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {allImages.map((url, idx) => (
                <button
                  key={url}
                  onClick={() => handleThumbnailClick(idx)}
                  className={[
                    'aspect-square overflow-hidden rounded-lg bg-muted transition-all duration-200 focus:outline-none',
                    activeIndex === idx
                      ? 'ring-2 ring-primary ring-offset-2 scale-105'
                      : 'opacity-60 hover:opacity-100 hover:scale-105',
                  ].join(' ')}
                >
                  <img src={url} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </Card>

        <Card className="space-y-5">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold" dir="ltr">
                {product.title}
              </h2>
              <span className="text-sm font-medium text-muted-foreground">
                ID: {product.id}
              </span>
            </div>
            <p className="mt-1 text-lg text-muted-foreground" dir="rtl">
              {product.titleAr}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={product.inStock ? 'success' : 'danger'}>
              {product.inStock ? t('products.inStock') : t('products.outOfStock')}
            </Badge>
            {product.featured ? <Badge variant="primary">{t('products.featured')}</Badge> : null}
            <Badge variant="muted">{product.category}</Badge>
          </div>

          <div>
            <p className="text-3xl font-semibold">
              {formatCurrency(finalPrice, i18n.language)}
            </p>
            {product.discount > 0 ? (
              <p className="text-sm text-muted-foreground">
                <span className="line-through">
                  {formatCurrency(product.price, i18n.language)}
                </span>{' '}
                · {t('products.discountOff', { value: product.discount })}
              </p>
            ) : null}
          </div>

          <StarRating value={product.rating} />
          <p className="text-sm text-muted-foreground">
            {t('products.reviewsCount', { count: product.reviews })}
          </p>

          <div className="space-y-2">
            <p className="text-sm font-medium">{t('products.description')}</p>
            <p className="text-sm leading-relaxed text-muted-foreground" dir="ltr">
              {product.description}
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground" dir="rtl">
              {product.descriptionAr}
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">{t('products.tags')}</p>
            <div className="flex flex-wrap gap-2">
              {product.tags.map((tag) => (
                <Badge key={tag} variant="primary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <p className="text-sm text-muted-foreground">
            {t('products.whatsNumber')}:{' '}
            <span className="font-medium text-foreground" dir="ltr">
              {product.whatsNumber}
            </span>
          </p>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => void handleDelete()}
        title={t('products.deleteTitle')}
        description={t('products.deleteDescription')}
        loading={deleting}
        confirmLabel={t('common.delete')}
      />
    </div>
  );
}
