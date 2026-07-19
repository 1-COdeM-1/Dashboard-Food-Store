import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

export interface DropdownItem {
  label: string;
  onClick: () => void;
  danger?: boolean;
  icon?: ReactNode;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  align?: 'start' | 'end';
  className?: string;
}

export function Dropdown({ trigger, items, align = 'end', className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div ref={ref} className={cn('relative inline-flex', className)}>
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open ? (
        <div
          className={cn(
            'absolute top-full z-40 mt-2 min-w-44 animate-[fade-in_150ms_ease-out] rounded-xl border border-border bg-surface-elevated p-1 shadow-lg',
            align === 'end' ? 'end-0' : 'start-0',
          )}
          role="menu"
        >
          {items.map((item) => (
            <Button
              key={item.label}
              variant="ghost"
              className={cn(
                'h-9 w-full justify-start gap-2 rounded-lg px-3 text-sm font-normal',
                item.danger && 'text-danger hover:bg-danger/10 hover:text-danger',
              )}
              onClick={() => {
                item.onClick();
                setOpen(false);
              }}
            >
              {item.icon}
              {item.label}
            </Button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
