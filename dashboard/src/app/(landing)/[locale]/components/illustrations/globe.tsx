'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import type { IllustrationProps } from './types';

/* client-only (WebGL), fetched once the card is first entered */
const GlobeScene = dynamic(() => import('./globeScene').then((m) => m.GlobeScene), { ssr: false });

export function Globe({ entered }: IllustrationProps) {
  const t = useTranslations('landing.illustrations.globe');
  return (
    <div className='size-full' role='img' aria-label={t('alt')}>
      {entered && <GlobeScene />}
    </div>
  );
}
