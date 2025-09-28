'use client';

import type { eventWithTime } from '@rrweb/types';
import { EventType, IncrementalSource } from '@rrweb/types';
import { cn } from '@/lib/utils';

export type TimelineMarkerDescriptor = {
  label: string;
  timestamp: number;
  icon?: React.ReactNode;
};

export type TimelineMarker = TimelineMarkerDescriptor & {
  id: string;
};

type ReplayTimelineProps = {
  markers: TimelineMarker[];
  durationMs: number;
  currentTime?: number;
  onJump: (timestamp: number) => void;
};

export function buildTimelineMarkers(
  events: eventWithTime[],
  originTimestamp?: number,
): TimelineMarkerDescriptor[] {
  if (events.length === 0) {
    return [];
  }

  const baseTimestamp = originTimestamp ?? events[0].timestamp;

  return events
    .map((event): TimelineMarkerDescriptor | null => {
      const timeFromStart = event.timestamp - baseTimestamp;

      if (timeFromStart < 0) {
        return null;
      }

      if (event.type === EventType.FullSnapshot) {
        return {
          label: 'Full snapshot',
          timestamp: timeFromStart,
        } satisfies TimelineMarkerDescriptor;
      }

      if (event.type === EventType.IncrementalSnapshot) {
        const source = event.data?.source;
        if (source === IncrementalSource.MouseInteraction) {
          const interactionName = event.data.type ?? 'Interaction';
          return {
            label: interactionName,
            timestamp: timeFromStart,
          } satisfies TimelineMarkerDescriptor;
        }

        if (source === IncrementalSource.Input) {
          return {
            label: 'Input',
            timestamp: timeFromStart,
          } satisfies TimelineMarkerDescriptor;
        }

        if (source === IncrementalSource.Location) {
          return {
            label: 'Navigation',
            timestamp: timeFromStart,
          } satisfies TimelineMarkerDescriptor;
        }
      }

      if (event.type === EventType.Custom) {
        const customLabel = event.data?.tag || event.data?.name || 'Custom event';
        return {
          label: customLabel,
          timestamp: timeFromStart,
        } satisfies TimelineMarkerDescriptor;
      }

      return null;
    })
    .filter((marker): marker is TimelineMarkerDescriptor => Boolean(marker));
}

export function ReplayTimeline({ markers, durationMs, currentTime = 0, onJump }: ReplayTimelineProps) {
  if (durationMs <= 0) {
    return null;
  }

  return (
    <div className='space-y-3'>
      <h3 className='text-muted-foreground text-sm font-medium tracking-tight'>Timeline</h3>
      <div className='border-border/60 bg-muted/40 rounded-lg border p-3'>
        {markers.length === 0 ? (
          <p className='text-muted-foreground text-xs'>No key events detected yet.</p>
        ) : (
          <ul className='flex flex-col gap-2'>
            {markers.map((marker) => {
              const progress = Math.min(marker.timestamp / durationMs, 1);
              const isActive = currentTime >= marker.timestamp && currentTime < marker.timestamp + 2000;

              return (
                <li key={marker.id}>
                  <button
                    type='button'
                    onClick={() => onJump(marker.timestamp)}
                    className={cn(
                      'hover:bg-primary/10 focus-visible:ring-primary/40 w-full rounded-md px-3 py-2 text-left text-xs transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                      isActive && 'bg-primary/10 text-primary hover:bg-primary/10',
                    )}
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <span className='font-medium'>{marker.label}</span>
                      <span className='text-muted-foreground'>{formatDuration(marker.timestamp)}</span>
                    </div>
                    <div className='bg-muted mt-1 h-1 rounded-full'>
                      <div
                        className='bg-primary h-full rounded-full'
                        style={{ width: `${Math.max(progress * 100, 1)}%` }}
                      />
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
