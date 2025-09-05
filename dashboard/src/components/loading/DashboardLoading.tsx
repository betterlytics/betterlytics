import React from 'react';
import { Spinner } from '@/components/ui/spinner';
import { useTranslations } from 'next-intl';

export default function DashboardLoading() {
  const t = useTranslations('components.loading.dashboard');
  return (
    <div className='bg-background flex min-h-screen items-center justify-center'>
      <div className='text-center'>
        <div className='mb-4 flex justify-center'>
          <Spinner size='lg' />
        </div>
        <h2 className='text-foreground mb-2 text-lg font-semibold'>{t('initializing')}</h2>
        <p className='text-muted-foreground text-sm'>{t('loadingSettings')}</p>
      </div>
    </div>
  );
}
