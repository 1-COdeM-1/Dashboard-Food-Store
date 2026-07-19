import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StarRating({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('inline-flex items-center gap-0.5', className)} aria-label={`${value} stars`}>
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = value >= i + 1;
        const half = !filled && value > i && value < i + 1;
        return (
          <Star
            key={i}
            className={cn(
              'size-3.5',
              filled || half ? 'fill-warning text-warning' : 'text-border',
            )}
          />
        );
      })}
      <span className="ms-1 text-xs text-muted-foreground">{value.toFixed(1)}</span>
    </div>
  );
}
