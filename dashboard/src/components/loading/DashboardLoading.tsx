import React from 'react';

import { AnimatedDashboardLogo } from '@/components/loading/AnimatedDashboardLogo';
import { useTranslations } from 'next-intl';

export default function DashboardLoading() {
  const t = useTranslations('components.loading.dashboard');
  return (
    <div className='bg-background flex min-h-screen items-center justify-center'>
      <div className='text-center'>
        <div className='mb-6 flex justify-center'>
          <AnimatedDashboardLogo size={80} />
        </div>
        <h2 className='text-foreground mb-2 text-lg font-semibold'>{t('initializing')}</h2>
        <p className='text-muted-foreground text-sm'>{t('loadingSettings')}</p>
      </div>
    </div>
  );
}
