'use client';

import type { eventWithTime } from '@rrweb/types';
import { EventType, IncrementalSource } from '@rrweb/types';
import { cn } from '@/lib/utils';
import {
  MousePointer2,
  MousePointerSquareDashed,
  FilePen,
  ScrollText,
  Route,
  Keyboard,
  Camera,
  Tag,
} from 'lucide-react';

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
          return {
            label: 'Mouse Interaction',
            timestamp: timeFromStart,
          } satisfies TimelineMarkerDescriptor;
        }

        if (source === IncrementalSource.Selection) {
          return {
            label: 'Selection',
            timestamp: timeFromStart,
          } satisfies TimelineMarkerDescriptor;
        }

        if (source === IncrementalSource.Scroll) {
          return {
            label: 'Scroll',
            timestamp: timeFromStart,
          } satisfies TimelineMarkerDescriptor;
        }

        if (source === IncrementalSource.Mutation) {
          return {
            label: 'DOM Mutation',
            timestamp: timeFromStart,
          } satisfies TimelineMarkerDescriptor;
        }

        if (source === IncrementalSource.Input) {
          return {
            label: 'Input',
            timestamp: timeFromStart,
          } satisfies TimelineMarkerDescriptor;
        }
      }

      if (event.type === EventType.Custom) {
        const customLabel = event.data?.tag || 'Custom event';
        return {
          label: customLabel,
          timestamp: timeFromStart,
        } satisfies TimelineMarkerDescriptor;
      }

      return null;
    })
    .filter((marker): marker is TimelineMarkerDescriptor => Boolean(marker));
}

function iconForLabel(label: string): React.ReactNode {
  switch (label) {
    case 'Mouse Interaction':
      return <MousePointer2 className='h-4 w-4' />;
    case 'Selection':
      return <MousePointerSquareDashed className='h-4 w-4' />;
    case 'DOM Mutation':
      return <FilePen className='h-4 w-4' />;
    case 'Scroll':
      return <ScrollText className='h-4 w-4' />;
    case 'Navigation':
      return <Route className='h-4 w-4' />;
    case 'Input':
      return <Keyboard className='h-4 w-4' />;
    case 'Full snapshot':
      return <Camera className='h-4 w-4' />;
    default:
      return <Tag className='h-4 w-4' />;
  }
}

type TimelineGroup = {
  id: string;
  label: string;
  count: number;
  start: number;
  end: number;
  jumpTo: number;
  icon: React.ReactNode;
};

function buildGroups(markers: TimelineMarker[]): TimelineGroup[] {
  if (markers.length === 0) return [];
  const sorted = [...markers].sort((a, b) => a.timestamp - b.timestamp);
  const groups: TimelineGroup[] = [];
  let current: TimelineGroup | null = null;

  sorted.forEach((m, index) => {
    if (!current || current.label !== m.label) {
      current = {
        id: `group-${index}`,
        label: m.label,
        count: 1,
        start: m.timestamp,
        end: m.timestamp,
        jumpTo: m.timestamp,
        icon: iconForLabel(m.label),
      };
      groups.push(current);
    } else {
      current.count += 1;
      current.end = m.timestamp;
    }
  });

  return groups;
}

export function ReplayTimeline({ markers, durationMs, currentTime = 0, onJump }: ReplayTimelineProps) {
  if (durationMs <= 0) {
    return null;
  }

  const groups = buildGroups(markers);
  const totalEvents = markers.length;

  return (
    <div className='space-y-3'>
      <div>
        <h3 className='text-muted-foreground text-sm font-medium tracking-tight'>Timeline</h3>
        <p className='text-muted-foreground mt-1 text-xs'>
          {totalEvents} events captured ({groups.length} groups)
        </p>
      </div>
      <div className='border-border/60 bg-muted/40 rounded-lg border p-3'>
        {groups.length === 0 ? (
          <p className='text-muted-foreground text-xs'>No key events detected yet.</p>
        ) : (
          <ul className='flex flex-col gap-2'>
            {groups.map((group) => {
              const isActive = currentTime >= group.start && currentTime < group.end + 2000;
              const progress = Math.min(group.start / durationMs, 1);

              return (
                <li key={group.id}>
                  <button
                    type='button'
                    onClick={() => onJump(group.jumpTo)}
                    className={cn(
                      'hover:bg-primary/10 focus-visible:ring-primary/40 w-full rounded-md px-3 py-2 text-left text-xs transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                      isActive && 'bg-primary/10 text-primary hover:bg-primary/10',
                    )}
                  >
                    <div className='flex items-center justify-between gap-2'>
                      <div className='flex items-center gap-2'>
                        <span className='text-muted-foreground'>{group.icon}</span>
                        <span className='font-medium'>
                          {group.label}{' '}
                          {group.count > 1 && <span className='text-muted-foreground'>(×{group.count})</span>}
                        </span>
                      </div>
                      <span className='text-muted-foreground'>{formatDuration(group.start)}</span>
                    </div>
                    <div className='mt-1 flex items-center justify-between gap-2'>
                      <div className='bg-muted h-1 w-full rounded-full'>
                        <div
                          className='bg-primary h-full rounded-full'
                          style={{ width: `${Math.max(progress * 100, 1)}%` }}
                        />
                      </div>
                      {group.end > group.start && (
                        <span className='text-muted-foreground ml-2 shrink-0'>
                          {formatDuration(group.end - group.start)} duration
                        </span>
                      )}
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
