'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import { type getWorldMapGranularityTimeseries } from '@/app/actions';

// Dynamically import the DeckGLMap component
const DynamicDeckGLMap = dynamic(() => import('@/components/map/deckgl/DeckGLMap'), {
  ssr: false, // disable server-side rendering
  loading: () => <div>Loading map…</div>, // optional fallback
});

interface DeckGLMapWrapperProps {
  visitorData: Awaited<ReturnType<typeof getWorldMapGranularityTimeseries>>;
  initialZoom?: number;
}

export default function DeckGLMapWrapper({ visitorData, initialZoom }: DeckGLMapWrapperProps) {
  return <DynamicDeckGLMap visitorData={visitorData} initialZoom={initialZoom} />;
}
