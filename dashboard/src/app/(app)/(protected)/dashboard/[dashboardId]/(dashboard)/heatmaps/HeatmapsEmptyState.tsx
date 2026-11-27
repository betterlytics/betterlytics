'use client';

import { useTranslations } from 'next-intl';
import { Camera, ExternalLink as ExternalLinkIcon, MousePointerClick, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ExternalLink from '@/components/ExternalLink';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';
import { FrameMessage } from './HeatmapFrame';

/** For sites that have never sent a heatmap click */
export function SetUpHeatmapsMessage() {
  const t = useTranslations('components.heatmaps.empty');

  return (
    <FrameMessage
      icon={<MousePointerClick className='h-5 w-5' />}
      title={t('title')}
      description={t.rich('description', {
        code: (chunks) => <code className='bg-muted rounded px-1 py-0.5 font-mono text-xs'>{chunks}</code>,
      })}
    >
      <Button asChild size='sm'>
        <ExternalLink
          href='https://betterlytics.io/docs/integration/heatmaps'
          target='_blank'
          rel='noopener noreferrer'
        >
          <ExternalLinkIcon className='h-4 w-4' />
          {t('setUp')}
        </ExternalLink>
      </Button>
    </FrameMessage>
  );
}

/** For heatmap data that still failed to load after the query's own retries */
export function HeatmapLoadError({ onRetry, retrying }: { onRetry: () => void; retrying: boolean }) {
  const t = useTranslations('components.heatmaps.loadError');

  return (
    <FrameMessage icon={<TriangleAlert className='h-5 w-5' />} title={t('title')}>
      <Button size='sm' variant='outline' className='cursor-pointer' disabled={retrying} onClick={onRetry}>
        {t('retry')}
      </Button>
    </FrameMessage>
  );
}

/** For a page and device without a background to draw the clicks on */
export function NoCaptureMessage({ onCapture }: { onCapture: () => void }) {
  const t = useTranslations('components.heatmaps');
  const { hasPermission } = useDashboardAuth();
  const canCapture = hasPermission('canCaptureHeatmaps');

  return (
    <FrameMessage
      icon={<Camera className='h-5 w-5' />}
      title={canCapture ? t('empty.noCaptureEditor') : t('empty.noCaptureViewer')}
    >
      {canCapture && (
        <Button size='sm' className='cursor-pointer' onClick={onCapture}>
          {t('capture.captureButton')}
        </Button>
      )}
    </FrameMessage>
  );
}
