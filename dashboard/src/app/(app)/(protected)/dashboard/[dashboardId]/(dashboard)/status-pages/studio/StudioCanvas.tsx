'use client';

import { useTranslations } from 'next-intl';
import { Minus, Monitor, Plus, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { type StatusPagePreviewPayload } from '@/entities/analytics/statusPage/publicStatusPage.entities';
import {
  LivePreview,
  type PreviewDraft,
} from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/LivePreview';
import { useStudioZoom } from './useStudioZoom';

type StudioCanvasProps = {
  draft: PreviewDraft;
  preview: { payload: StatusPagePreviewPayload; messages: Record<string, unknown> } | null;
  previewError: boolean;
  publicHost: string;
  enlargedOpen: boolean;
  onEnlargedOpenChange: (open: boolean) => void;
};

export function StudioCanvas({
  draft,
  preview,
  previewError,
  publicHost,
  enlargedOpen,
  onEnlargedOpenChange,
}: StudioCanvasProps) {
  const t = useTranslations('statusPagesPage.editor');
  const { containerRef, device, zoom, frameStyle, stepZoom, switchDevice, resetZoom } = useStudioZoom();

  return (
    <div
      ref={containerRef}
      className='text-muted-foreground relative hidden min-h-0 flex-1 items-center justify-center overflow-hidden bg-black/[0.03] lg:flex dark:bg-black/30'
      style={{
        backgroundImage:
          'radial-gradient(circle, color-mix(in srgb, currentColor 18%, transparent) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {!preview && !previewError ? (
        <div className='text-muted-foreground flex flex-col items-center gap-3'>
          <Spinner size='sm' />
          <span className='text-sm'>{t('loadingPreview')}</span>
        </div>
      ) : previewError || !preview ? (
        <p className='text-muted-foreground text-sm'>{t('error')}</p>
      ) : (
        zoom != null && (
          <div className='flex max-h-full w-full overflow-x-auto overflow-y-hidden px-8 py-10'>
            <LivePreview
              payload={preview.payload}
              messages={preview.messages}
              publicHost={publicHost}
              draft={draft}
              enlargeable
              hoverEnlarge={false}
              enlargedOpen={enlargedOpen}
              onEnlargedOpenChange={onEnlargedOpenChange}
              zoom={zoom}
              frameStyle={frameStyle}
              className='max-h-full flex-none shadow-xl'
            />
          </div>
        )
      )}

      {preview && zoom != null && (
        <div className='bg-popover border-border absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-full border p-1 shadow-lg'>
          <button
            type='button'
            onClick={() => stepZoom(-1)}
            aria-label={t('studio.zoomOut')}
            className='text-muted-foreground hover:text-foreground hover:bg-accent flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-colors'
          >
            <Minus className='h-3.5 w-3.5' />
          </button>
          <button
            type='button'
            onClick={resetZoom}
            title={t('studio.zoomFit')}
            className='text-foreground hover:bg-accent cursor-pointer rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums transition-colors'
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type='button'
            onClick={() => stepZoom(1)}
            aria-label={t('studio.zoomIn')}
            className='text-muted-foreground hover:text-foreground hover:bg-accent flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-colors'
          >
            <Plus className='h-3.5 w-3.5' />
          </button>
          <span className='bg-border mx-1 h-4 w-px' aria-hidden />
          <button
            type='button'
            onClick={() => switchDevice('desktop')}
            aria-label={t('studio.desktopPreview')}
            aria-pressed={device === 'desktop'}
            className={cn(
              'flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-colors',
              device === 'desktop' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Monitor className='h-3.5 w-3.5' />
          </button>
          <button
            type='button'
            onClick={() => switchDevice('mobile')}
            aria-label={t('studio.mobilePreview')}
            aria-pressed={device === 'mobile'}
            className={cn(
              'flex h-7 w-7 cursor-pointer items-center justify-center rounded-full transition-colors',
              device === 'mobile' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Smartphone className='h-3.5 w-3.5' />
          </button>
        </div>
      )}
    </div>
  );
}
