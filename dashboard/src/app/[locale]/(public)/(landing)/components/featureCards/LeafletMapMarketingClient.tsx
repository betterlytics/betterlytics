'use client';

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type LeafletMap from '@/components/map/LeafletMap';

const LeafletMapNoSSR = dynamic(() => import('@/components/map/LeafletMap'), {
  ssr: false,
  loading: () => <div className='h-full w-full' />,
});

export default function LeafletMapMarketingClient(props: ComponentProps<typeof LeafletMap>) {
  return <LeafletMapNoSSR {...props} />;
}
