import { useRef, useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Badge } from './Badge';

export interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  error?: string;
  label?: string;
}

export function TagInput({ value, onChange, error, label }: TagInputProps) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const addTag = (raw: string) => {
    const tag = raw.trim();
    if (!tag || value.includes(tag)) {
      setDraft('');
      return;
    }
    onChange([...value, tag]);
    setDraft('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? <label className="text-sm font-medium text-foreground">{label}</label> : null}
      <div
        className={cn(
          'flex min-h-10 w-full flex-wrap items-center gap-2 rounded-lg border border-border bg-surface px-2 py-1.5 shadow-sm transition-all duration-200',
          'focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/30',
          error && 'border-danger',
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <Badge key={tag} variant="primary" className="gap-1 pe-1">
            {tag}
            <button
              type="button"
              className="rounded p-0.5 hover:bg-black/10"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              aria-label={`Remove ${tag}`}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => addTag(draft)}
          placeholder={t('products.addTag')}
          className="min-w-28 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
