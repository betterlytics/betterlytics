'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import BetterlyticsLogoLoading from '@/components/loading/BetterlyticsLogoLoading';

interface DemoDashboardIframeProps {
  src: string;
}

export function DemoDashboardIframe({ src }: DemoDashboardIframeProps) {
  const [loaded, setLoaded] = useState(false);
  const t = useTranslations('components.loading.dashboard');

  return (
    <div className='relative h-full w-full'>
      {!loaded && (
        <BetterlyticsLogoLoading
          title={t('initializing')}
          description={t('loadingSettings')}
          className='absolute inset-0 rounded-[1.5rem]'
        />
      )}
      <iframe
        allowFullScreen
        src={src}
        title='Betterlytics live demo'
        loading='lazy'
        sandbox='allow-scripts allow-same-origin'
        referrerPolicy='no-referrer'
        className='absolute inset-0 h-full w-full border-0'
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
