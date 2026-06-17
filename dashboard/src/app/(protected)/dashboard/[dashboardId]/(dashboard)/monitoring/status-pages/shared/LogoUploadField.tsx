'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2, Upload, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { PermissionGate } from '@/components/tooltip/PermissionGate';
import { useStatusPageLogo } from './useStatusPageLogo';

type LogoUploadFieldProps = {
  dashboardId: string;
  statusPageId: string;
  logoUrl: string | null;
  /** Keeps the caller's local logo state (and live preview) in sync with uploads/removals. */
  onLogoChange: (logoUrl: string | null) => void;
};

/** Logo upload/replace/remove tile with a fixed footprint so the layout never shifts mid-upload. */
export function LogoUploadField({ dashboardId, statusPageId, logoUrl, onLogoChange }: LogoUploadFieldProps) {
  const t = useTranslations('statusPagesPage.editor');
  const inputRef = useRef<HTMLInputElement>(null);
  const { selectLogo, removeLogo, uploading, busy } = useStatusPageLogo({
    dashboardId,
    statusPageId,
    onChange: onLogoChange,
  });

  return (
    <div className='space-y-2'>
      <Label>{t('logo')}</Label>
      <input
        ref={inputRef}
        type='file'
        accept='image/png,image/jpeg,image/webp'
        className='hidden'
        onChange={selectLogo}
      />
      <PermissionGate>
        {(disabled) =>
          logoUrl ? (
            // Fixed-size chip, same footprint as the empty tile so uploading doesn't shift layout.
            <div className='relative h-20 w-20'>
              <button
                type='button'
                aria-label={t('replaceLogo')}
                disabled={disabled || busy}
                onClick={() => inputRef.current?.click()}
                className='group border-input relative block h-20 w-20 cursor-pointer overflow-hidden rounded-md border disabled:cursor-not-allowed'
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- owner-provided logo, not optimizable via next/image */}
                <img src={logoUrl} alt='' className='h-full w-full object-contain p-1.5' />
                <span className='absolute inset-0 flex flex-col items-center justify-center gap-0.5 bg-black/55 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus:opacity-100'>
                  <Upload className='h-4 w-4' />
                  {t('replaceLogo')}
                </span>
                {busy && (
                  <span className='absolute inset-0 flex items-center justify-center bg-black/55'>
                    <Loader2 className='h-5 w-5 animate-spin text-white' />
                  </span>
                )}
              </button>
              <button
                type='button'
                aria-label={t('removeLogo')}
                disabled={disabled || busy}
                onClick={removeLogo}
                className='border-input bg-background text-muted-foreground hover:text-destructive absolute -top-1.5 -right-1.5 z-10 flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50'
              >
                <X className='h-3 w-3' />
              </button>
            </div>
          ) : (
            <button
              type='button'
              disabled={disabled || busy}
              onClick={() => inputRef.current?.click()}
              className='border-input text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed px-1 text-center text-[10px] leading-tight transition-colors disabled:cursor-not-allowed disabled:opacity-50'
            >
              {uploading ? <Loader2 className='h-5 w-5 animate-spin' /> : <Upload className='h-5 w-5' />}
              {t('uploadLogo')}
            </button>
          )
        }
      </PermissionGate>
    </div>
  );
}
