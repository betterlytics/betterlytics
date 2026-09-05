'use client';

import { useState } from 'react';
import { COPY } from '@/app/(app)/[locale]/(landing-v2)/v2/content/copy';

export function DemoFrame({ src }: { src: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className='demo__frame'>
      {!loaded && <div className='demo__load'>{COPY.demo.loading}</div>}
      <iframe
        src={src}
        title={COPY.demo.frameTitle}
        loading='lazy'
        allowFullScreen
        sandbox='allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox'
        referrerPolicy='no-referrer'
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}
