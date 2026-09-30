'use client';

import dynamic from 'next/dynamic';
import type { IllustrationProps } from './types';

/* WebGL only runs in the browser, and the chunk is only worth fetching once the
   card is about to be seen, so the scene loads on first entry. */
const GlobeScene = dynamic(() => import('./globeScene').then((m) => m.GlobeScene), { ssr: false });

/**
 * The picture in words for screen readers, which the scene is hidden from; kept
 * beside the art so the two change together.
 */
const DESCRIPTION =
  'A turning globe marking where visitors arrive from, each city called out with the source that sent them, such as Copenhagen via ChatGPT.';

export function Globe({ entered }: IllustrationProps) {
  return (
    <>
      <p className='sr-only'>{DESCRIPTION}</p>
      {entered && <GlobeScene />}
    </>
  );
}
