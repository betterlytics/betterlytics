'use client';

import { useTranslations } from 'next-intl';
import { Spinner } from '@/components/ui/spinner';

/** Browser-chrome skeleton shown in the wizard's preview slot while the draft preview loads. */
export function PreviewLoadingFrame({ publicHost, slug }: { publicHost: string; slug: string }) {
  const t = useTranslations('statusPagesPage.editor');
  return (
    <div className='bg-card border-border flex flex-col overflow-hidden rounded-xl border'>
      <div className='border-border flex flex-none items-center gap-1.5 border-b px-3 py-2'>
        <span className='bg-muted-foreground/30 h-2 w-2 flex-none rounded-full' />
        <span className='bg-muted-foreground/30 h-2 w-2 flex-none rounded-full' />
        <span className='bg-muted-foreground/30 h-2 w-2 flex-none rounded-full' />
        <span className='bg-muted text-muted-foreground ml-2 min-w-0 flex-1 truncate rounded-md px-2.5 py-0.5 text-xs'>
          {`${publicHost}/status/${slug}`}
        </span>
      </div>
      <div className='flex min-h-[360px] flex-col items-center justify-center gap-3'>
        <Spinner size='sm' />
        <span className='text-muted-foreground text-sm'>{t('loadingPreview')}</span>
      </div>
    </div>
  );
}
