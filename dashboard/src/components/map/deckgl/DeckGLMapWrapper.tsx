'use client';

import dynamic from 'next/dynamic';
import React from 'react';
import type { GeoVisitor } from '@/entities/geography';

// Dynamically import the DeckGLMap component
const DynamicDeckGLMap = dynamic(() => import('@/components/map/deckgl/DeckGLMap'), {
  ssr: false, // disable server-side rendering
  loading: () => <div>Loading map…</div>, // optional fallback
});

interface DeckGLMapWrapperProps {
  visitorData: GeoVisitor[];
  initialZoom?: number;
}

export default function DeckGLMapWrapper({ visitorData, initialZoom }: DeckGLMapWrapperProps) {
  return <DynamicDeckGLMap visitorData={visitorData} initialZoom={initialZoom} />;
}
