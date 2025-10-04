'use client';

import { ChevronDown, Pause, Play } from 'lucide-react';
import { memo, useEffect, useId } from 'react';
import { cn } from '@/lib/utils';
import type { TimelineMarker } from '@/app/dashboard/[dashboardId]/replay/ReplayTimeline';
import { markerFillColorForLabel } from '@/app/dashboard/[dashboardId]/replay/utils/colors';
import { useTheme } from 'next-themes';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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
}: Props) {
  const ratio = durationMs > 0 ? Math.max(0, Math.min(1, currentTime / durationMs)) : 0;

  const { resolvedTheme } = useTheme();
  useEffect(() => {
    createMarkerCanvas(resolvedTheme, durationMs, markers);
  }, [durationMs, markers, resolvedTheme]);

  const skipInactivityId = useId();

  return (
    <div className={cn('bg-muted/60 border-border/60 flex items-center gap-3 border-t px-3 py-2', className)}>
      <button
        type='button'
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className='bg-background hover:bg-accent text-foreground focus-visible:ring-primary/50 inline-flex h-7 w-7 items-center justify-center rounded-md border text-sm shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none'
        onClick={onTogglePlay}
      >
        {isPlaying ? <Pause className='h-4 w-4' /> : <Play className='h-4 w-4' />}
      </button>

      <div className='flex items-center gap-2 pl-1 text-[11px]'>
        <Switch
          id={skipInactivityId}
          checked={isSkippingInactivity}
          onCheckedChange={(checked) => onSkipInactivityChange?.(checked)}
          className='h-[18px] w-9'
          disabled={onSkipInactivityChange === undefined}
        />
        <Label htmlFor={skipInactivityId} className='text-muted-foreground text-[11px] font-normal'>
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
          <input
            type='range'
            min={0}
            max={1000}
            step={1}
            aria-label='Seek'
            value={Math.round(ratio * 1000)}
            onChange={(e) => onSeekRatio(Number(e.target.value) / 1000)}
            className='range-sm range accent-primary w-full'
          />
        </div>
        <div className='text-muted-foreground w-12 shrink-0 text-[11px] tabular-nums'>
          {formatClock(durationMs)}
        </div>
      </div>

      <div className='relative'>
        <select
          aria-label='Playback speed'
          value={speed}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          className='bg-background text-foreground hover:bg-accent focus-visible:ring-primary/50 peer block h-7 appearance-none rounded-md border px-2 pr-6 text-xs shadow-sm focus-visible:ring-2 focus-visible:outline-none'
        >
          <option value={1}>1x</option>
          <option value={2}>2x</option>
          <option value={4}>4x</option>
          <option value={8}>8x</option>
        </select>
        <ChevronDown className='text-muted-foreground pointer-events-none absolute top-1.5 right-1.5 h-4 w-4' />
      </div>
    </div>
  );
}

export const ReplayControls = memo(ReplayControlsComponent);

export default ReplayControls;
