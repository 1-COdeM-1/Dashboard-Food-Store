import { useRef, useState, type DragEvent } from 'react';
import { GripVertical, ImagePlus, Star, Trash2, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Badge } from './Badge';

export interface ImageDropzoneProps {
  images: string[];
  onChange: (images: string[]) => void;
  onUpload: (files: File[]) => Promise<string[]>;
  onRemoveRemote?: (url: string) => Promise<void>;
  uploading?: boolean;
  error?: string;
}

export function ImageDropzone({
  images,
  onChange,
  onUpload,
  onRemoveRemote,
  uploading = false,
  error,
}: ImageDropzoneProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const handleFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (files.length === 0) return;
    const urls = await onUpload(files);
    onChange([...images, ...urls]);
  };

  const onDrop = async (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    await handleFiles(e.dataTransfer.files);
  };

  const removeAt = async (index: number) => {
    const url = images[index];
    const next = images.filter((_, i) => i !== index);
    onChange(next);
    if (onRemoveRemote && url.startsWith('http')) {
      try {
        await onRemoveRemote(url);
      } catch {
        // Keep UI responsive; toast handled upstream if needed
      }
    }
  };

  const onImageDragStart = (index: number) => setDragIndex(index);

  const onImageDrop = (index: number) => {
    if (dragIndex === null || dragIndex === index) return;
    const next = [...images];
    const [moved] = next.splice(dragIndex, 1);
    next.splice(index, 0, moved);
    onChange(next);
    setDragIndex(null);
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-4 py-10 text-center transition-all duration-200',
          dragOver && 'border-primary bg-accent/40 scale-[1.01]',
          uploading && 'pointer-events-none opacity-70',
        )}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
        }}
      >
        <div className="flex size-12 items-center justify-center rounded-full bg-surface shadow-sm">
          {uploading ? (
            <Upload className="size-5 animate-pulse text-primary" />
          ) : (
            <ImagePlus className="size-5 text-primary" />
          )}
        </div>
        <p className="text-sm font-medium text-foreground">
          {uploading ? t('products.uploading') : t('products.dropzoneTitle')}
        </p>
        <p className="text-xs text-muted-foreground">{t('products.dropzoneHint')}</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((url, index) => (
            <div
              key={`${url}-${index}`}
              draggable
              onDragStart={() => onImageDragStart(index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onImageDrop(index)}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border bg-muted shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <img src={url} alt="" className="size-full object-cover" />
              <div className="absolute inset-x-0 top-0 flex items-center justify-between p-2 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="rounded-md bg-black/50 p-1 text-white">
                  <GripVertical className="size-3.5" />
                </span>
                <Button
                  type="button"
                  variant="danger"
                  size="icon"
                  className="size-7"
                  onClick={() => void removeAt(index)}
                  aria-label="Remove image"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              {index === 0 ? (
                <Badge variant="primary" className="absolute start-2 bottom-2 gap-1">
                  <Star className="size-3 fill-current" />
                  {t('products.cover')}
                </Badge>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
