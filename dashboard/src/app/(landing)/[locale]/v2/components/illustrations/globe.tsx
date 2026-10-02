'use client';

import dynamic from 'next/dynamic';
import { COPY } from '@/landing/content/copy';
import type { IllustrationProps } from './types';

/* client-only (WebGL), fetched once the card is first entered */
const GlobeScene = dynamic(() => import('./globeScene').then((m) => m.GlobeScene), { ssr: false });

export function Globe({ entered }: IllustrationProps) {
  return (
    <div className='size-full' role='img' aria-label={COPY.illustrations.globe}>
      {entered && <GlobeScene />}
    </div>
  );
}
