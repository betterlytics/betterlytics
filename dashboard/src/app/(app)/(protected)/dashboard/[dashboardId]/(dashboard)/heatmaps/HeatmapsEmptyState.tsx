'use client';

import { useTranslations } from 'next-intl';
import { ExternalLink as ExternalLinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ExternalLink from '@/components/ExternalLink';

const HEAT =
  'radial-gradient(circle, rgba(255,0,0,0.85) 0%, rgba(255,255,0,0.7) 22%, rgba(0,255,0,0.5) 40%, rgba(0,255,255,0.3) 58%, rgba(0,0,255,0.15) 72%, transparent 80%)';

const HEAT_SPOTS = [
  { left: '1%', top: '44%', size: 110 },
  { left: '64%', top: '-3%', size: 64 },
  { left: '74%', top: '-3%', size: 52 },
  { left: '8%', top: '74%', size: 72 },
  { left: '76%', top: '78%', size: 56 },
];

function MockHeatmap() {
  return (
    <div className='border-border overflow-hidden rounded-lg border opacity-60'>
      <div className='bg-muted/60 border-border/60 flex h-8 items-center gap-1.5 border-b px-3'>
        {[0, 1, 2].map((dot) => (
          <span key={dot} className='bg-muted-foreground/30 h-2 w-2 rounded-full' />
        ))}
      </div>
      <div className='bg-card relative h-80 overflow-hidden p-6'>
        <div className='flex items-center justify-between'>
          <div className='bg-muted-foreground/25 h-4 w-20 rounded' />
          <div className='flex gap-4'>
            {[0, 1, 2, 3].map((link) => (
              <div key={link} className='bg-muted-foreground/20 h-3 w-12 rounded' />
            ))}
          </div>
        </div>
        <div className='mt-12 space-y-3'>
          <div className='bg-muted-foreground/20 h-6 w-2/3 rounded' />
          <div className='bg-muted-foreground/20 h-6 w-1/2 rounded' />
          <div className='bg-muted-foreground/15 h-3 w-1/3 rounded' />
        </div>
        <div className='mt-6 flex gap-3'>
          <div className='bg-primary/60 h-9 w-32 rounded-md' />
          <div className='bg-muted-foreground/20 h-9 w-28 rounded-md' />
        </div>
        <div className='mt-10 grid grid-cols-3 gap-4'>
          {[0, 1, 2].map((card) => (
            <div key={card} className='bg-muted-foreground/15 h-24 rounded-md' />
          ))}
        </div>
        {HEAT_SPOTS.map((spot) => (
          <span
            key={`${spot.left}-${spot.top}`}
            className='pointer-events-none absolute rounded-full'
            style={{ left: spot.left, top: spot.top, width: spot.size, height: spot.size, background: HEAT }}
          />
        ))}
      </div>
    </div>
  );
}

export function HeatmapsEmptyState() {
  const t = useTranslations('components.heatmaps.empty');

  return (
    <div className='relative mx-auto flex min-h-[60vh] max-w-4xl flex-col items-center justify-center'>
      <div className='relative w-full'>
        <MockHeatmap />

        <div className='from-background via-background/60 to-background/20 pointer-events-none absolute inset-0 bg-gradient-to-t' />

        <div className='absolute inset-0 flex flex-col items-center justify-center'>
          <div className='bg-background/70 space-y-4 rounded-xl px-8 py-6 text-center backdrop-blur-sm'>
            <div className='space-y-2'>
              <h2 className='text-2xl font-semibold tracking-tight'>{t('title')}</h2>
              <p className='text-muted-foreground mx-auto max-w-md text-sm leading-relaxed'>
                {t.rich('description', {
                  code: (chunks) => (
                    <code className='bg-muted rounded px-1 py-0.5 font-mono text-xs'>{chunks}</code>
                  ),
                })}
              </p>
            </div>
            <Button asChild>
              <ExternalLink
                href='https://betterlytics.io/docs/integration/heatmaps'
                target='_blank'
                rel='noopener noreferrer'
              >
                <ExternalLinkIcon className='mr-2 h-4 w-4' />
                {t('setUp')}
              </ExternalLink>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
