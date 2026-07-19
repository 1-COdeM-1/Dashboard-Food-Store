import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useAuthStore } from '@/features/auth/useAuthStore';
import { useThemeStore } from '@/features/theme/useThemeStore';
import { ToastViewport } from '@/components/ui/Toast';

export function App() {
  const initialize = useAuthStore((s) => s.initialize);
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <>
      <RouterProvider router={router} />
      <ToastViewport />
    </>
  );
}
