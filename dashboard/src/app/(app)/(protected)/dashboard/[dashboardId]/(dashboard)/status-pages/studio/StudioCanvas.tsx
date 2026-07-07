'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Minus, Monitor, Plus, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';
import { type StatusPagePreviewPayload } from '@/entities/analytics/statusPage/publicStatusPage.entities';
import { LivePreview } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/LivePreview';
import { type StatusPageFormState } from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/status-pages/shared/useStatusPageFormState';

/** Logical page width the preview renders at, per device. Desktop matches the public page's max-w-3xl. */
const DEVICE_WIDTH = { desktop: 768, mobile: 390 } as const;
const ZOOM_MIN = 0.4;
// Grid-aligned: the max must be a multiple of the step or clamping strands the zoom off-grid.
const ZOOM_MAX = 1.2;
const ZOOM_STEP = 0.1;
/** Breathing room between the frame and the canvas edges when fitting. */
const FIT_PADDING = 96;

type Device = keyof typeof DEVICE_WIDTH;

type StudioCanvasProps = {
  form: StatusPageFormState;
  preview: { payload: StatusPagePreviewPayload; messages: Record<string, unknown> } | null;
  previewError: boolean;
  publicHost: string;
  /** The mobile header "Preview" button controls the enlarged dialog from outside. */
  enlargedOpen: boolean;
  onEnlargedOpenChange: (open: boolean) => void;
};

/**
 * The studio's hero: the live page centered on a dot-grid canvas, with a floating
 * zoom pill (fit-by-default) and a desktop/mobile width toggle.
 */
export function StudioCanvas({
  form,
  preview,
  previewError,
  publicHost,
  enlargedOpen,
  onEnlargedOpenChange,
}: StudioCanvasProps) {
  const t = useTranslations('statusPagesPage.editor');

  const containerRef = useRef<HTMLDivElement>(null);
  const [availableWidth, setAvailableWidth] = useState<number | null>(null);
  const [device, setDevice] = useState<Device>('desktop');
  /** null = fit-to-canvas (recomputes on resize); a number = user-pinned zoom. */
  const [pinnedZoom, setPinnedZoom] = useState<number | null>(null);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new ResizeObserver((entries) => {
      setAvailableWidth(entries[0]?.contentRect.width ?? null);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const fitZoom = useMemo(() => {
    if (availableWidth == null) return null;
    const fit = (availableWidth - FIT_PADDING) / DEVICE_WIDTH[device];
    return Math.min(1, Math.max(ZOOM_MIN, fit));
  }, [availableWidth, device]);

  const zoom = pinnedZoom ?? fitZoom;

  const stepZoom = useCallback(
    (direction: 1 | -1) => {
      setPinnedZoom((current) => {
        const base = current ?? fitZoom ?? 1;
        // Snap to the 10% grid: stepping from an arbitrary fit value (92% → 100%, not 102%)
        // always lands on round steps, in either direction. Epsilon guards float division.
        const gridSteps =
          direction === 1 ? Math.floor(base / ZOOM_STEP + 1e-6) + 1 : Math.ceil(base / ZOOM_STEP - 1e-6) - 1;
        const next = Math.round(gridSteps * ZOOM_STEP * 100) / 100;
        return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, next));
      });
    },
    [fitZoom],
  );

  const switchDevice = (next: Device) => {
    setDevice(next);
    // A pinned zoom was chosen for the old width; refit for the new one.
    setPinnedZoom(null);
  };

  return (
    <div
      ref={containerRef}
      // Slightly darker than the app chrome so the panel/header read as tools above the work
      // surface and the page frame gets its elevation back — that contrast is the dot grid's job.
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
          <div className='flex max-h-full w-full justify-center overflow-hidden px-8 py-10'>
            <LivePreview
              payload={preview.payload}
              messages={preview.messages}
              publicHost={publicHost}
              draft={form.previewDraft}
              enlargeable
              enlargedOpen={enlargedOpen}
              onEnlargedOpenChange={onEnlargedOpenChange}
              zoom={zoom}
              frameStyle={{ width: Math.round(DEVICE_WIDTH[device] * zoom) }}
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
            onClick={() => setPinnedZoom(null)}
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
