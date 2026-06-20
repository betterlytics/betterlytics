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
  type StatusPageImageKind,
} from '@/entities/analytics/statusPage/statusPage.entities';
import { resizeImageToWebp } from './resizeImage';

// Generous guard so we don't read an enormous file into the tab before resizing; the canvas step
// shrinks it to well under the server cap regardless.
const MAX_SOURCE_BYTES = 10 * 1024 * 1024;

type ImageUploadFieldProps = {
  kind: StatusPageImageKind;
  /** Current preview URL (a server URL or a staged object URL); null when none. */
  value: string | null;
  /** Receives the resized WebP blob to stage. */
  onSelect: (blob: Blob) => void;
  /** Stages removal of the current image. */
  onRemove: () => void;
};

export function ImageUploadField({ kind, value, onSelect, onRemove }: ImageUploadFieldProps) {
  const t = useTranslations('statusPagesPage.editor');
  const inputRef = useRef<HTMLInputElement>(null);
  const [processing, setProcessing] = useState(false);

  const text = {
    logo: { label: t('logo'), upload: t('uploadLogo') },
    favicon: { label: t('favicon'), upload: t('uploadFavicon') },
  }[kind];

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow re-selecting the same file
    if (!file) return;
    if (file.size > MAX_SOURCE_BYTES) {
      toast.error(t('imageTooLarge'));
      return;
    }
    setProcessing(true);
    try {
      const blob = await resizeImageToWebp(file, STATUS_PAGE_IMAGE_CONFIG[kind]);
      onSelect(blob);
    } catch {
      toast.error(t('error'));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className='space-y-2'>
      <Label>{text.label}</Label>
      <input ref={inputRef} type='file' accept={STATUS_PAGE_IMAGE_ACCEPT} className='hidden' onChange={handleFile} />
      <PermissionGate>
        {(disabled) =>
          value ? (
            <div className='relative h-20 w-20'>
              <button
                type='button'
                aria-label={t('replaceImage')}
                disabled={disabled || processing}
                onClick={() => inputRef.current?.click()}
                className='group border-input relative block h-20 w-20 cursor-pointer overflow-hidden rounded-md border disabled:cursor-not-allowed'
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- owner-provided image, not optimizable via next/image */}
                <img src={value} alt='' className='h-full w-full object-contain p-1.5' />
                <span className='absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/55 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100'>
                  <Upload className='h-4 w-4' />
                  {t('replaceImage')}
                </span>
                {processing && (
                  <span className='absolute inset-0 flex items-center justify-center bg-black/55'>
                    <Loader2 className='h-5 w-5 animate-spin text-white' />
                  </span>
                )}
              </button>
              <button
                type='button'
                aria-label={t('removeImage')}
                disabled={disabled || processing}
                onClick={onRemove}
                className='border-input bg-background text-muted-foreground hover:text-destructive absolute -top-1.5 -right-1.5 z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50'
              >
                <X className='h-3 w-3' />
              </button>
            </div>
          ) : (
            <button
              type='button'
              disabled={disabled || processing}
              onClick={() => inputRef.current?.click()}
              className='border-input text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed px-1 text-center text-[10px] leading-tight transition-colors disabled:cursor-not-allowed disabled:opacity-50'
            >
              {processing ? <Loader2 className='h-5 w-5 animate-spin' /> : <Upload className='h-5 w-5' />}
              {text.upload}
            </button>
          )
        }
      </PermissionGate>
    </div>
  );
}
