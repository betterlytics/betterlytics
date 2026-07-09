'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import {
  STATUS_PAGE_IMAGE_ACCEPT,
  STATUS_PAGE_IMAGE_CONFIG,
  STATUS_PAGE_LIMITS,
  type StatusPageImageKind,
} from '@/entities/analytics/statusPage/statusPage.entities';
import { cn } from '@/lib/utils';
import { sanitizeSvgLogo } from '@/lib/svgSanitizer';
import { resizeImageToWebp } from './resizeImage';

// Generous guard so we don't read an enormous file into the tab before resizing; the canvas step
// shrinks it to well under the server cap regardless.
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

type ImageUploadFieldProps = {
  kind: StatusPageImageKind;
  value: string | null;
  onSelect: (blob: Blob) => void;
  onRemove: () => void;
};

export function ImageUploadField({ kind, value, onSelect, onRemove }: ImageUploadFieldProps) {
  const t = useTranslations('statusPagesPage.editor');
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const text = {
    logo: { label: t('logo'), upload: t('uploadLogo') },
    favicon: { label: t('favicon'), upload: t('uploadFavicon') },
  }[kind];

  const processFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_SOURCE_BYTES) {
      toast.error(t('imageTooLarge'));
      return;
    }
    setProcessing(true);
    try {
      // SVG logos stay vector: sanitize instead of rasterizing. Staging the sanitizer's output
      // means the preview shows exactly what the server (which re-runs the same check) will store.
      const isSvg = file.type === 'image/svg+xml' || /\.svg$/i.test(file.name);
      if (isSvg && kind === 'logo') {
        if (file.size > STATUS_PAGE_LIMITS.IMAGE_MAX_BYTES) {
          toast.error(t('imageTooLarge'));
          return;
        }
        const sanitized = sanitizeSvgLogo(new Uint8Array(await file.arrayBuffer()));
        if (!sanitized) {
          toast.error(t('svgUnsafe'));
          return;
        }
        onSelect(new Blob([sanitized], { type: 'image/svg+xml' }));
        return;
      }
      const blob = await resizeImageToWebp(file, STATUS_PAGE_IMAGE_CONFIG[kind]);
      // The server enforces the same cap at save time; failing here keeps the feedback immediate.
      if (blob.size > STATUS_PAGE_LIMITS.IMAGE_MAX_BYTES) {
        toast.error(t('imageTooLarge'));
        return;
      }
      onSelect(blob);
    } catch {
      toast.error(t('error'));
    } finally {
      setProcessing(false);
    }
  };

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow re-selecting the same file
    void processFile(file);
  };

  const openPicker = () => inputRef.current?.click();

  return (
    <PermissionGate>
      {(disabled) => (
        <div className='space-y-1.5'>
          <Label>{text.label}</Label>
          <div
            className='relative h-16 w-full'
            onDragOver={(event) => {
              if (disabled || processing) return;
              event.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragOver(false);
              if (disabled || processing) return;
              void processFile(event.dataTransfer.files?.[0]);
            }}
          >
            <input
              ref={inputRef}
              type='file'
              accept={STATUS_PAGE_IMAGE_ACCEPT[kind]}
              className='hidden'
              onChange={handleFile}
            />
            <button
              type='button'
              onClick={openPicker}
              disabled={disabled || processing}
              aria-label={value ? t('replaceImage') : text.upload}
              className={cn(
                'group relative block h-full w-full cursor-pointer overflow-hidden rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                value
                  ? 'border-input'
                  : 'text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 border-dashed',
                dragOver && 'border-primary bg-primary/5',
              )}
            >
              {value ? (
                // eslint-disable-next-line @next/next/no-img-element -- owner-provided image, not optimizable via next/image
                <img src={value} alt='' className='h-full w-full object-contain p-1.5' />
              ) : (
                <span className='flex h-full w-full items-center justify-center'>
                  <Upload className='h-5 w-5' />
                </span>
              )}

              {value && (
                <span className='absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/55 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100'>
                  <Upload className='h-4 w-4' />
                  {t('replaceImage')}
                </span>
              )}

              {processing && (
                <span className='absolute inset-0 flex items-center justify-center bg-black/55'>
                  <Loader2 className='h-5 w-5 animate-spin text-white' />
                </span>
              )}
            </button>

            {value && (
              <button
                type='button'
                aria-label={t('removeImage')}
                disabled={disabled || processing}
                onClick={onRemove}
                className='border-input bg-background text-muted-foreground hover:text-destructive absolute -top-1.5 -right-1.5 z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50'
              >
                <X className='h-3 w-3' />
              </button>
            )}
          </div>
        </div>
      )}
    </PermissionGate>
  );
}
