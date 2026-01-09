'use client';

import { Maximize2, Minimize2, Pause, Play, ChevronDown } from 'lucide-react';
import { memo, useCallback, useEffect, useId, useMemo, useState } from 'react';
import type { TimelineMarker } from './ReplayTimeline';
import { markerFillColorForLabel } from './utils/colors';
import type { SessionReplay } from '@/entities/analytics/sessionReplays.entities';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTranslations } from 'next-intl';

type Props = {
  isPlaying: boolean;
  currentTime: number;
  durationMs: number;
  speed: number;
  onTogglePlay: () => void;
  isSkippingInactivity?: boolean;
  onSkipInactivityChange?: (value: boolean) => void;
  onSeekRatio: (ratio: number) => void; // 0..1
  onSpeedChange: (speed: number) => void;
  session?: SessionReplay | null;
  markers?: TimelineMarker[];
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
};

function formatClock(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function resizeCanvasToDisplaySize(canvas: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();

  const displayWidth = Math.round(rect.width * dpr);
  const displayHeight = Math.round(rect.height * dpr);

  if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
    canvas.width = displayWidth;
    canvas.height = displayHeight;
  }

  return { dpr, cssWidth: rect.width, cssHeight: rect.height };
}

function applyCanvasTransform(canvas: HTMLCanvasElement, dpr: number) {
  const ctx = canvas.getContext('2d');
  if (ctx === null) {
    return;
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function createMarkerCanvas(
  theme: string | undefined,
  loadedDurationMs: number,
  expectedDurationMs?: number,
  markers?: TimelineMarker[],
) {
  if (!expectedDurationMs || loadedDurationMs <= 0 || !markers || markers.length === 0) {
    return;
  }

  const durationMs = Math.max(loadedDurationMs, 1000 * expectedDurationMs);

  const canvas = document.getElementById('marker-canvas') as HTMLCanvasElement | null;
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;

  const { dpr, cssWidth, cssHeight } = resizeCanvasToDisplaySize(canvas);
  applyCanvasTransform(canvas, dpr);

  const resolvedTheme = theme || 'light';

  ctx.clearRect(0, 0, cssWidth, cssHeight);
  markers.forEach((marker) => {
    ctx.fillStyle = markerFillColorForLabel(resolvedTheme, marker.key);
    const left = cssWidth * (marker.timestamp / durationMs);
    ctx.fillRect(left, 0, 4, cssHeight);
  });
}

function createRangeCanvas(
  theme: string | undefined,
  currentTime: number,
  loadedDurationMs: number,
  expectedDurationMs?: number,
) {
  if (!expectedDurationMs || loadedDurationMs <= 0) {
    return;
  }

  const durationMs = Math.max(loadedDurationMs, 1000 * expectedDurationMs);

  const canvas = document.getElementById('range-canvas') as HTMLCanvasElement | null;
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;

  const { dpr, cssWidth, cssHeight } = resizeCanvasToDisplaySize(canvas);
  applyCanvasTransform(canvas, dpr);

  const resolvedTheme = theme || 'light';

  // Clear background
  ctx.fillStyle = resolvedTheme === 'light' ? '#EEEEEE' : '#111111';
  ctx.fillRect(0, 0, cssWidth, cssHeight);

  // Fill loaded
  ctx.fillStyle = resolvedTheme === 'light' ? '#CCCCCC' : '#222222';
  const leftLoaded = cssWidth * (loadedDurationMs / durationMs);
  ctx.fillRect(0, 0, leftLoaded, cssHeight);

  // Fill current
  ctx.fillStyle = 'oklch(56% 0.196 268.74)';
  const left = cssWidth * (currentTime / durationMs);
  ctx.fillRect(0, 0, left, cssHeight);
}

function ReplayControlsComponent({
  isPlaying,
  currentTime,
  durationMs,
  speed,
  onTogglePlay,
  isSkippingInactivity = false,
  onSkipInactivityChange,
  onSeekRatio,
  onSpeedChange,
  session,
  markers = [],
  isFullscreen = false,
  onToggleFullscreen,
}: Props) {
  const t = useTranslations('components.sessionReplay.player');

  const { resolvedTheme } = useTheme();
  useEffect(() => {
    createMarkerCanvas(resolvedTheme, durationMs, session?.duration, markers);
  }, [durationMs, markers, resolvedTheme, session]);

  useEffect(() => {
    createRangeCanvas(resolvedTheme, currentTime, durationMs, session?.duration);
  }, [durationMs, currentTime, resolvedTheme, session]);

  // Redraw on viewport resize/zoom changes so DPR and sizes stay in sync
  useEffect(() => {
    const handleResize = () => {
      createMarkerCanvas(resolvedTheme, durationMs, session?.duration, markers);
      createRangeCanvas(resolvedTheme, currentTime, durationMs, session?.duration);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [resolvedTheme, durationMs, currentTime, session?.duration]);

  const onRangeClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;

      const ratio = Math.max(Math.min(x / rect.width, 1), 0);

      onSeekRatio(ratio);
    },
    [onSeekRatio],
  );

  const [hoverTooltipX, setHoverTooltipX] = useState<{ x: number; timestamp: number } | null>(null);
  const onRangeHover = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
      if (!session?.duration) {
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      const x = event.clientX - rect.left;

      const ratio = Math.max(Math.min(x / rect.width, 1), 0);
      const timestamp = ratio * session.duration * 1000;
      setHoverTooltipX({
        x,
        timestamp,
      });
    },
    [session?.duration],
  );

  const skipInactivityId = useId();
  const playbackOptions = useMemo(
    () => [
      { label: '1x', value: 1 },
      { label: '2x', value: 2 },
      { label: '4x', value: 4 },
      { label: '8x', value: 8 },
    ],
    [],
  );

  return (
    <div className='bg-muted/60 border-border/60 flex flex-col gap-1 border-t px-3 py-2'>
      <div className='relative flex-1 space-y-1'>
        <canvas className='pointer-events-none z-[1000] flex h-1.5 w-full items-center' id='marker-canvas' />
        {hoverTooltipX && (
          <div
            className='dark:bg-secondary absolute flex h-8 w-16 items-center justify-center rounded-md border bg-white text-sm shadow-md'
            style={{
              top: -30,
              left: hoverTooltipX.x - 32,
            }}
          >
            {formatClock(hoverTooltipX.timestamp)}
          </div>
        )}
        <canvas
          className='z-[1000] h-2 w-full cursor-pointer border'
          id='range-canvas'
          onClick={onRangeClick}
          onMouseMove={onRangeHover}
          onMouseLeave={() => setHoverTooltipX(null)}
        />
      </div>

      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button
            type='button'
            aria-label={isPlaying ? 'Pause' : 'Play'}
            size='icon'
            variant='ghost'
            onClick={onTogglePlay}
            className='h-7 w-7 cursor-pointer'
          >
            {isPlaying ? <Pause className='h-4 w-4' /> : <Play className='h-4 w-4' />}
          </Button>

          <div className='text-muted-foreground flex min-w-0 flex-1 items-center gap-2 text-xs tabular-nums'>
            {formatClock(currentTime)} / {formatClock(durationMs)}
          </div>
        </div>

        <div className='flex gap-2'>
          <div className='flex items-center gap-2 rounded px-1 text-[11px]'>
            <Switch
              id={skipInactivityId}
              checked={isSkippingInactivity}
              onCheckedChange={(checked) => onSkipInactivityChange?.(checked)}
              disabled={onSkipInactivityChange === undefined}
              className='cursor-pointer'
            />
            <Label
              htmlFor={skipInactivityId}
              className='text-muted-foreground cursor-pointer text-[11px] font-normal'
            >
              {t('skipInactive')}
            </Label>
          </div>
          <div className='flex items-center gap-2'>
            <div className='relative'>
              {isFullscreen ? (
                <>
                  <select
                    aria-label={t('playbackSpeedAria')}
                    value={String(speed)}
                    onChange={(e) => onSpeedChange(Number(e.target.value))}
                    className='border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50 h-7 max-h-7 min-h-0 min-w-[60px] cursor-pointer appearance-none rounded-md border bg-transparent px-2 pr-6 text-xs leading-none shadow-xs outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50'
                  >
                    {playbackOptions.map((option) => (
                      <option key={option.value} value={String(option.value)}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className='pointer-events-none absolute top-1/2 right-2 h-4 w-4 -translate-y-1/2 opacity-50' />
                </>
              ) : (
                <Select value={String(speed)} onValueChange={(value) => onSpeedChange(Number(value))}>
                  <SelectTrigger
                    size='sm'
                    aria-label={t('playbackSpeedAria')}
                    className='h-7 max-h-7 min-h-0 min-w-[40px] cursor-pointer gap-1 px-2 py-0 text-xs leading-none'
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className='min-w-[60px]'>
                    {playbackOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={String(option.value)}
                        className='cursor-pointer text-xs'
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {onToggleFullscreen && (
              <Button
                type='button'
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                size='icon'
                variant='ghost'
                onClick={onToggleFullscreen}
                className='h-7 w-7 cursor-pointer'
              >
                {isFullscreen ? <Minimize2 className='h-4 w-4' /> : <Maximize2 className='h-4 w-4' />}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export const ReplayControls = memo(ReplayControlsComponent);

export default ReplayControls;
