import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Package, Star, Boxes, BadgeCheck, MessageSquare, AlertTriangle } from 'lucide-react';
import { fetchOverviewStats } from '@/features/products/api';
import type { Product } from '@/types/product';
import { Card, CardHeader } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { computeFinalPrice, formatCurrency } from '@/lib/utils';

interface Stats {
  total: number;
  inStock: number;
  outOfStock: number;
  featured: number;
  avgRating: number;
  totalReviews: number;
  byCategory: { name: string; value: number }[];
  recent: Product[];
}

export function DashboardOverviewPage() {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isAr = i18n.language.startsWith('ar');

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const data = await fetchOverviewStats();
        if (cancelled) return;
        setStats(data);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const load = () => {
    setLoading(true);
    setError(null);
    void fetchOverviewStats()
      .then((data) => {
        setStats(data);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Failed to load');
      })
      .finally(() => setLoading(false));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (error || !stats) {
    return (
      <EmptyState
        icon={<AlertTriangle className="size-6 text-warning" />}
        title={t('products.loadFailed')}
        description={error ?? undefined}
          action={
          <Button onClick={load}>{t('common.retry')}</Button>
        }
      />
    );
  }

  const cards = [
    { label: t('overview.totalProducts'), value: stats.total, icon: Package },
    { label: t('overview.inStock'), value: stats.inStock, icon: Boxes },
    { label: t('overview.outOfStock'), value: stats.outOfStock, icon: AlertTriangle },
    { label: t('overview.featured'), value: stats.featured, icon: BadgeCheck },
    { label: t('overview.avgRating'), value: stats.avgRating.toFixed(1), icon: Star },
    { label: t('overview.totalReviews'), value: stats.totalReviews, icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t('overview.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('overview.subtitle')}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <Card
            key={card.label}
            className="group transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="mt-2 text-3xl font-semibold tracking-tight">{card.value}</p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-transform duration-200 group-hover:scale-105">
                <card.icon className="size-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader title={t('overview.byCategory')} />
          {stats.byCategory.length === 0 ? (
            <EmptyState title={t('overview.noCategories')} className="py-10" />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.byCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--surface-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                    }}
                  />
                  <Bar dataKey="value" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader
            title={t('overview.recentProducts')}
            action={
              <Link to="/dashboard/products">
                <Button variant="ghost" size="sm">
                  {t('nav.products')}
                </Button>
              </Link>
            }
          />
          {stats.recent.length === 0 ? (
            <EmptyState
              title={t('overview.noRecent')}
              action={
                <Link to="/dashboard/products/new">
                  <Button size="sm">{t('products.addProduct')}</Button>
                </Link>
              }
              className="py-10"
            />
          ) : (
            <ul className="space-y-3">
              {stats.recent.map((product) => (
                <li key={product.id}>
                  <Link
                    to={`/dashboard/products/${product.id}`}
                    className="flex items-center gap-3 rounded-xl border border-transparent p-2 transition-all duration-200 hover:border-border hover:bg-muted/50"
                  >
                    <div className="size-11 overflow-hidden rounded-lg bg-muted">
                      {product.images[0] ? (
                        <img src={product.images[0]} alt="" className="size-full object-cover" />
                      ) : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium" dir={isAr ? 'rtl' : 'ltr'}>
                        {isAr ? product.titleAr : product.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(
                          computeFinalPrice(product.price, product.discount),
                          i18n.language,
                        )}
                      </p>
                    </div>
                    <Badge variant={product.inStock ? 'success' : 'danger'}>
                      {product.inStock ? t('products.inStock') : t('products.outOfStock')}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
