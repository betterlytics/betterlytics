'use client';

import React from 'react';
import BetterlyticsLogoLoading from '@/components/loading/BetterlyticsLogoLoading';
import { useTranslations } from 'next-intl';

export default function DashboardLoading() {
  const t = useTranslations('components.loading.dashboard');
  return <BetterlyticsLogoLoading title={t('initializing')} description={t('loadingSettings')} className='min-h-screen' />;
}
