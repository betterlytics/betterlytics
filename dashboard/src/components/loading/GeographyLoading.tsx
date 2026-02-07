'use client';

import React from 'react';
import BetterlyticsLoading from '@/components/loading/BetterlyticsLoading';
import { useTranslations } from 'next-intl';

export default function GeographyLoading() {
  const t = useTranslations('components.loading.geography');
  return <BetterlyticsLoading title={t('title')} description={t('description')} />;
}
