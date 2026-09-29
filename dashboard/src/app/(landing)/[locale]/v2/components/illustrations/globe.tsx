'use client';

import dynamic from 'next/dynamic';
import type { IllustrationProps } from './types';

/* WebGL only runs in the browser, and the chunk is only worth fetching once the
   card is about to be seen, so the scene loads on first entry. */
const GlobeScene = dynamic(() => import('./globeScene').then((m) => m.GlobeScene), { ssr: false });

export function Globe(props: IllustrationProps) {
  if (!props.entered) return <div className='ac' />;
  return <GlobeScene {...props} />;
}
