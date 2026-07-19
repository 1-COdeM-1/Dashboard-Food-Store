import { useToastStore } from './useToastStore';

export function useToast() {
  const push = useToastStore((s) => s.push);
  return {
    success: (title: string, description?: string) =>
      push({ title, description, variant: 'success' }),
    error: (title: string, description?: string) => push({ title, description, variant: 'error' }),
    info: (title: string, description?: string) => push({ title, description, variant: 'info' }),
  };
}
