'use client';

import dynamic from 'next/dynamic';
import { COPY } from '@/landing/content/copy';
import type { IllustrationProps } from './types';

/* WebGL only runs in the browser, and the chunk is only worth fetching once the
   card is about to be seen, so the scene loads on first entry. */
const GlobeScene = dynamic(() => import('./globeScene').then((m) => m.GlobeScene), { ssr: false });

/** The globe as one labelled image, there before the scene loads and without JavaScript. */
export function Globe({ entered }: IllustrationProps) {
  return (
    <div className='size-full' role='img' aria-label={COPY.illustrations.globe}>
      {entered && <GlobeScene />}
    </div>
  );
}
