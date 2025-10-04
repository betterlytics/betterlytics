'use client';

import { Maximize2, Minimize2, Pause, Play } from 'lucide-react';
import { memo, useEffect, useId, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { TimelineMarker } from '@/app/dashboard/[dashboardId]/replay/ReplayTimeline';
import { markerFillColorForLabel } from '@/app/dashboard/[dashboardId]/replay/utils/colors';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

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
  markers?: TimelineMarker[];
  className?: string;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
};

function formatClock(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function createMarkerCanvas(theme: string | undefined, durationMs: number, markers?: TimelineMarker[]) {
  if (durationMs <= 0 || !markers || markers.length === 0) {
    return;
  }

  const canvas = document.getElementById('marker-canvas') as HTMLCanvasElement | null;
  if (canvas === null) {
    return;
  }

  const ctx = canvas.getContext('2d');

  if (ctx === null) {
    return;
  }

  const resolvedTheme = theme || 'light';

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  markers.forEach((marker) => {
    ctx.fillStyle = markerFillColorForLabel(resolvedTheme, marker.label);
    const left = canvas.width * (marker.timestamp / durationMs);
    ctx.fillRect(left, 0, 4, 40);
  });
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
  markers = [],
  className,
  isFullscreen = false,
  onToggleFullscreen,
}: Props) {
  const ratio = durationMs > 0 ? Math.max(0, Math.min(1, currentTime / durationMs)) : 0;

  const { resolvedTheme } = useTheme();
  useEffect(() => {
    createMarkerCanvas(resolvedTheme, durationMs, markers);
  }, [durationMs, markers, resolvedTheme]);

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
    <div className={cn('bg-muted/60 border-border/60 flex items-center gap-3 border-t px-3 py-2', className)}>
      <Button
        type='button'
        aria-label={isPlaying ? 'Pause' : 'Play'}
        size='icon'
        variant='outline'
        onClick={onTogglePlay}
        className='h-7 w-7 cursor-pointer'
      >
        {isPlaying ? <Pause className='h-4 w-4' /> : <Play className='h-4 w-4' />}
      </Button>

      <div className='flex items-center gap-2 pl-1 text-[11px]'>
        <Switch
          id={skipInactivityId}
          checked={isSkippingInactivity}
          onCheckedChange={(checked) => onSkipInactivityChange?.(checked)}
          disabled={onSkipInactivityChange === undefined}
          className='cursor-pointer'
        />
        <Label htmlFor={skipInactivityId} className='text-muted-foreground cursor-pointer text-[11px] font-normal'>
          Skip inactivity
        </Label>
      </div>

      <div className='flex min-w-0 flex-1 items-center gap-2'>
        <div className='text-muted-foreground w-12 shrink-0 text-right text-[11px] tabular-nums'>
          {formatClock(currentTime)}
        </div>
        <div className='relative flex-1'>
          <canvas
            className='bg-red pointer-events-none absolute -top-1.5 z-[1000] flex h-4 w-full items-center'
            id='marker-canvas'
          />
          <Slider
            aria-label='Seek'
            value={[Math.round(ratio * 1000)]}
            max={1000}
            step={1}
            onValueChange={([value]) => onSeekRatio((value as number) / 1000)}
            className='h-6 w-full cursor-pointer'
          />
        </div>
        <div className='text-muted-foreground w-12 shrink-0 text-[11px] tabular-nums'>
          {formatClock(durationMs)}
        </div>
      </div>

      <div className='flex items-center gap-2'>
        <div className='relative'>
          <Select value={String(speed)} onValueChange={(value) => onSpeedChange(Number(value))}>
            <SelectTrigger
              size='sm'
              aria-label='Playback speed'
              className='h-7 max-h-7 min-h-0 min-w-[60px] cursor-pointer gap-1 px-2 py-0 text-xs leading-none'
            >
              <SelectValue placeholder='Speed' />
            </SelectTrigger>
            <SelectContent className='min-w-[60px]'>
              {playbackOptions.map((option) => (
                <SelectItem key={option.value} value={String(option.value)} className='cursor-pointer text-xs'>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {onToggleFullscreen && (
          <Button
            type='button'
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            size='icon'
            variant='outline'
            onClick={onToggleFullscreen}
            className='h-7 w-7 cursor-pointer'
          >
            {isFullscreen ? <Minimize2 className='h-4 w-4' /> : <Maximize2 className='h-4 w-4' />}
          </Button>
        )}
      </div>
    </div>
  );
}

export const ReplayControls = memo(ReplayControlsComponent);

export default ReplayControls;
