'use client';

import React from 'react';
import BetterlyticsLoading from '@/components/loading/BetterlyticsLoading';
import { useTranslations } from 'next-intl';

export default function DashboardLoading() {
  const t = useTranslations('components.loading.dashboard');
  return <BetterlyticsLoading title={t('initializing')} description={t('loadingSettings')} className='min-h-screen' />;
}
