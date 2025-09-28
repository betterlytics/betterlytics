'use client';

import { ChevronDown, Pause, Play } from 'lucide-react';
import { memo, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { TimelineMarker } from '@/app/dashboard/[dashboardId]/replay/ReplayTimeline';
import { markerBgClassForLabel } from '@/app/dashboard/[dashboardId]/replay/utils/colors';

type Props = {
  isPlaying: boolean;
  currentTime: number;
  durationMs: number;
  speed: number;
  onTogglePlay: () => void;
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

function ReplayControlsComponent({
  isPlaying,
  currentTime,
  durationMs,
  speed,
  onTogglePlay,
  onSeekRatio,
  onSpeedChange,
  markers = [],
  className,
}: Props) {
  const ratio = durationMs > 0 ? Math.max(0, Math.min(1, currentTime / durationMs)) : 0;

  const markerPositions = useMemo(() => {
    if (durationMs <= 0 || markers.length === 0) return [] as { id: string; left: string; className: string }[];
    return markers.map((m) => ({
      id: m.id,
      left: `${(m.timestamp / durationMs) * 100}%`,
      className: markerBgClassForLabel(m.label),
    }));
  }, [markers, durationMs]);

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

      <div className='flex min-w-0 flex-1 items-center gap-2'>
        <div className='text-muted-foreground w-12 shrink-0 text-right text-[11px] tabular-nums'>
          {formatClock(currentTime)}
        </div>
        <div className='relative flex-1'>
          <div className='pointer-events-none absolute inset-x-2 -top-1.5 flex h-2 items-center gap-1'>
            {markerPositions.map((p) => (
              <div
                key={p.id}
                className={cn('h-1 w-1 rounded-full', p.className)}
                style={{ left: p.left, position: 'absolute' }}
              />
            ))}
          </div>
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
