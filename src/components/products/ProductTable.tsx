import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, Pencil, Trash2, Copy } from 'lucide-react';
import type { Product } from '@/types/product';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { StarRating } from '@/components/ui/StarRating';
import { computeFinalPrice, formatCurrency } from '@/lib/utils';

export interface ProductTableProps {
  products: Product[];
  selectedIds: number[];
  onToggleSelect: (id: number) => void;
  onToggleSelectAll: () => void;
  onDelete: (product: Product) => void;
  onDuplicate: (product: Product) => void;
}

export function ProductTable({
  products,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  onDelete,
  onDuplicate,
}: ProductTableProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language.startsWith('ar');
  const allSelected = products.length > 0 && products.every((p) => selectedIds.includes(p.id));

  const openProduct = (id: number) => {
    navigate(`/dashboard/products/${id}`);
  };

  return (
    <>
      {/* Desktop / large tablet table */}
      <div className="hidden w-full max-w-full overflow-hidden rounded-xl border border-border bg-surface shadow-sm lg:block">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[880px] text-start text-sm">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onToggleSelectAll}
                    aria-label="Select all"
                    className="size-4 rounded border-border"
                  />
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground">{t('products.thumbnail')}</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">{t('products.productTitle')}</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">{t('products.category')}</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">{t('products.price')}</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">{t('products.rating')}</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">{t('products.stock')}</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">{t('products.featured')}</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const finalPrice = computeFinalPrice(product.price, product.discount);
                return (
                  <tr
                    key={product.id}
                    role="link"
                    tabIndex={0}
                    onClick={() => openProduct(product.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openProduct(product.id);
                      }
                    }}
                    className="cursor-pointer border-b border-border last:border-0 transition-colors hover:bg-muted/40"
                  >
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(product.id)}
                        onChange={() => onToggleSelect(product.id)}
                        aria-label={`Select ${product.title}`}
                        className="size-4 rounded border-border"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="size-12 overflow-hidden rounded-lg border border-border bg-muted">
                        {product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <div className="flex size-full items-center justify-center text-[10px] text-muted-foreground">
                            {t('products.noImage')}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground" dir={isAr ? 'rtl' : 'ltr'}>
                        {isAr ? product.titleAr : product.title}
                      </p>
                      <p className="text-xs text-muted-foreground">#{product.id}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {isAr ? product.categoryAr : product.category}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">
                          {formatCurrency(finalPrice, i18n.language)}
                        </span>
                        {product.discount > 0 ? (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatCurrency(product.price, i18n.language)}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StarRating value={product.rating} />
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t('products.reviewsCount', { count: product.reviews })}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={product.inStock ? 'success' : 'danger'}>
                        {product.inStock ? t('products.inStock') : t('products.outOfStock')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {product.featured ? (
                        <Badge variant="primary">{t('products.featured')}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-1">
                        <Link to={`/dashboard/products/${product.id}`}>
                          <Button variant="ghost" size="icon" aria-label={t('common.view')}>
                            <Eye className="size-4" />
                          </Button>
                        </Link>
                        <Link to={`/dashboard/products/${product.id}/edit`}>
                          <Button variant="ghost" size="icon" aria-label={t('common.edit')}>
                            <Pencil className="size-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t('products.duplicate')}
                          className="text-primary hover:bg-primary/10"
                          onClick={() => onDuplicate(product)}
                        >
                          <Copy className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t('common.delete')}
                          className="text-danger hover:bg-danger/10 hover:text-danger"
                          onClick={() => onDelete(product)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Phone / small tablet stacked cards */}
      <div className="grid w-full max-w-full gap-3 lg:hidden">
        {products.map((product) => {
          const finalPrice = computeFinalPrice(product.price, product.discount);
          return (
            <div
              key={product.id}
              role="link"
              tabIndex={0}
              onClick={() => openProduct(product.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openProduct(product.id);
                }
              }}
              className="w-full max-w-full cursor-pointer overflow-hidden rounded-xl border border-border bg-surface p-3 shadow-sm transition-all duration-200 active:scale-[0.99] hover:shadow-md sm:p-4"
            >
              <div className="flex gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(product.id)}
                  onChange={() => onToggleSelect(product.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 size-4 shrink-0 rounded border-border"
                />
                <div className="size-14 shrink-0 overflow-hidden rounded-lg border border-border bg-muted sm:size-16">
                  {product.images[0] ? (
                    <img src={product.images[0]} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center text-[10px] text-muted-foreground">
                      {t('products.noImage')}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="truncate font-medium text-foreground" dir={isAr ? 'rtl' : 'ltr'}>
                    {isAr ? product.titleAr : product.title}
                  </p>
                  <p className="truncate text-sm text-muted-foreground">
                    {isAr ? product.categoryAr : product.category} · #{product.id}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {formatCurrency(finalPrice, i18n.language)}
                    </span>
                    {product.discount > 0 ? (
                      <span className="text-xs text-muted-foreground line-through">
                        {formatCurrency(product.price, i18n.language)}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <Badge variant={product.inStock ? 'success' : 'danger'}>
                      {product.inStock ? t('products.inStock') : t('products.outOfStock')}
                    </Badge>
                    {product.featured ? (
                      <Badge variant="primary">{t('products.featured')}</Badge>
                    ) : null}
                    <StarRating value={product.rating} />
                  </div>
                </div>
              </div>
              <div
                className="mt-3 grid grid-cols-4 gap-2 border-t border-border pt-3"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              >
                <Link to={`/dashboard/products/${product.id}`} className="min-w-0">
                  <Button variant="outline" size="sm" className="w-full px-2">
                    {t('common.view')}
                  </Button>
                </Link>
                <Link to={`/dashboard/products/${product.id}/edit`} className="min-w-0">
                  <Button variant="outline" size="sm" className="w-full px-2">
                    {t('common.edit')}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full px-2 text-primary border-primary/30 hover:bg-primary/10"
                  onClick={() => onDuplicate(product)}
                >
                  {t('products.duplicate')}
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="w-full px-2"
                  onClick={() => onDelete(product)}
                >
                  {t('common.delete')}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
