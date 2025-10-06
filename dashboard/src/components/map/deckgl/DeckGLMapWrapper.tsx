'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { type getWorldMapGranularityTimeseries } from '@/app/actions';
import DashboardLoading from '@/components/loading/DashboardLoading';
import { useTranslations } from 'next-intl';

interface DeckGLMapWrapperProps {
  visitorData: Awaited<ReturnType<typeof getWorldMapGranularityTimeseries>>;
  initialZoom?: number;
}

export default function DeckGLMapWrapper({ visitorData, initialZoom }: DeckGLMapWrapperProps) {
  const t = useTranslations('components.geography');

  const DynamicDeckGLMap = dynamic(() => import('@/components/map/deckgl/DeckGLMap'), {
    ssr: false,
    loading: () => <DashboardLoading title={t('loading')} subtitle={t('loadingMessage')} />,
  });

  return <DynamicDeckGLMap visitorData={visitorData} initialZoom={initialZoom} />;
}
