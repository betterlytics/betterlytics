'use client';

import React from 'react';
import BetterlyticsLogoLoading from '@/components/loading/BetterlyticsLogoLoading';
import { useTranslations } from 'next-intl';

export default function GeographyLoading() {
  const t = useTranslations('components.loading.geography');
  return <BetterlyticsLogoLoading title={t('title')} description={t('description')} />;
}
