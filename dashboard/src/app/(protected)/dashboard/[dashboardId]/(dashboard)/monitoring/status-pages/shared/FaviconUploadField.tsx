'use client';

import { useTranslations } from 'next-intl';
import { Upload } from 'lucide-react';
import { Label } from '@/components/ui/label';

export function FaviconUploadField() {
  const t = useTranslations('statusPagesPage.editor');

  return (
    <div className='space-y-2'>
      <Label>{t('favicon')}</Label>
      <button
        type='button'
        aria-label={t('uploadFavicon')}
        title={t('uploadFavicon')}
        className='border-input text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground flex h-16 w-16 cursor-pointer items-center justify-center rounded-md border border-dashed transition-colors'
      >
        <Upload className='h-4 w-4' />
      </button>
    </div>
  );
}
