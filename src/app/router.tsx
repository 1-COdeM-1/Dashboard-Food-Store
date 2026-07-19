import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Skeleton } from '@/components/ui/Skeleton';

const LoginPage = lazy(() =>
  import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })),
);
const DashboardOverviewPage = lazy(() =>
  import('@/pages/DashboardOverviewPage').then((m) => ({ default: m.DashboardOverviewPage })),
);
const ProductsPage = lazy(() =>
  import('@/pages/ProductsPage').then((m) => ({ default: m.ProductsPage })),
);
const ProductFormPage = lazy(() =>
  import('@/pages/ProductFormPage').then((m) => ({ default: m.ProductFormPage })),
);
const ProductDetailPage = lazy(() =>
  import('@/pages/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })),
);
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);

function PageFallback() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function withSuspense(element: React.ReactNode) {
  return <Suspense fallback={<PageFallback />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: withSuspense(<LoginPage />),
  },
  {
    path: '/',
    element: <RequireAuth />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          {
            path: 'dashboard',
            element: withSuspense(<DashboardOverviewPage />),
          },
          {
            path: 'dashboard/products',
            element: withSuspense(<ProductsPage />),
          },
          {
            path: 'dashboard/products/new',
            element: withSuspense(<ProductFormPage />),
          },
          {
            path: 'dashboard/products/:id',
            element: withSuspense(<ProductDetailPage />),
          },
          {
            path: 'dashboard/products/:id/edit',
            element: withSuspense(<ProductFormPage />),
          },
          {
            path: 'dashboard/settings',
            element: withSuspense(<SettingsPage />),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
