import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useToastStore } from '@/features/toast/useToastStore';
import { cn } from '@/lib/utils';
import { Button } from './Button';

const icons = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const styles = {
  success: 'border-success/30 bg-surface',
  error: 'border-danger/30 bg-surface',
  info: 'border-primary/30 bg-surface',
};

const iconStyles = {
  success: 'text-success',
  error: 'text-danger',
  info: 'text-primary',
};

export function ToastViewport() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed end-4 top-4 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => {
        const Icon = icons[toast.variant];
        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex animate-[slide-in-start_220ms_ease-out] items-start gap-3 rounded-xl border p-4 shadow-lg',
              styles[toast.variant],
            )}
            role="status"
          >
            <Icon className={cn('mt-0.5 size-5 shrink-0', iconStyles[toast.variant])} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{toast.title}</p>
              {toast.description ? (
                <p className="mt-0.5 text-sm text-muted-foreground">{toast.description}</p>
              ) : null}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
            >
              <X className="size-3.5" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
