'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type LeafletMap from '@/components/map/LeafletMap';
import { hideAntarcticaWhenEmpty } from '@/components/map/types';

const LeafletMapNoSSRComponent = dynamic(() => import('@/components/map/LeafletMap'), {
  ssr: false,
  loading: () => <div className='h-full w-full' />,
});

// Server components cannot pass functions across the boundary, so the world-map hide is applied here
export default function LeafletMapNoSSR(props: Omit<ComponentProps<typeof LeafletMap>, 'shouldHideFeature'>) {
  return <LeafletMapNoSSRComponent {...props} shouldHideFeature={hideAntarcticaWhenEmpty} />;
}
