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
  Eye,
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

const ICON_BASE_CLASS = 'h-5 w-5';

function iconForLabel(label: string): React.ReactNode {
  switch (label) {
    case 'Mouse Interaction':
      return <MousePointer2 className={`${ICON_BASE_CLASS} text-sky-500 dark:text-sky-400`} />;
    case 'Selection':
      return <MousePointerSquareDashed className={`${ICON_BASE_CLASS} text-emerald-500 dark:text-emerald-400`} />;
    case 'DOM Mutation':
      return <FilePen className={`${ICON_BASE_CLASS} text-violet-500 dark:text-violet-400`} />;
    case 'Scroll':
      return <ScrollText className={`${ICON_BASE_CLASS} text-amber-500 dark:text-amber-400`} />;
    case 'Navigation':
      return <Route className={`${ICON_BASE_CLASS} text-primary`} />;
    case 'Input':
      return <Keyboard className={`${ICON_BASE_CLASS} text-rose-500 dark:text-rose-400`} />;
    case 'Full snapshot':
      return <FilePen className={`${ICON_BASE_CLASS} text-violet-500 dark:text-violet-400`} />;
    case 'Pageview':
      return <Eye className={`${ICON_BASE_CLASS} text-sky-500 dark:text-sky-400`} />;
    default:
      return <Tag className={`${ICON_BASE_CLASS} text-muted-foreground`} />;
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

export function ReplayTimeline({ markers, currentTime = 0, onJump }: ReplayTimelineProps) {
  const groups = buildGroups(markers);
  const totalEvents = markers.length;

  return (
    <div className='bg-muted/40 border-border/60 flex h-screen flex-col overflow-hidden rounded-lg border'>
      <div className='bg-muted/60 sticky top-0 z-10 border-b px-4 py-3'>
        <h3 className='text-muted-foreground text-sm font-medium tracking-tight'>Timeline</h3>
        <p className='text-muted-foreground mt-1 text-xs'>
          {totalEvents} events captured ({groups.length} groups)
        </p>
      </div>
      <div className='flex-1 overflow-y-auto px-2 py-2'>
        {groups.length === 0 ? (
          <div className='text-muted-foreground flex h-full items-center justify-center px-2 text-xs'>
            No key events detected yet.
          </div>
        ) : (
          <ul className='divide-border/60 flex flex-col divide-y'>
            {groups.map((group) => {
              const isActive = currentTime >= group.start && currentTime < group.end + 2000;

              return (
                <li key={group.id}>
                  <button
                    type='button'
                    onClick={() => onJump(group.jumpTo)}
                    className={cn(
                      'hover:bg-primary/10 focus-visible:ring-primary/40 group flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-xs transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
                      isActive && 'bg-primary/10 text-primary hover:bg-primary/10',
                    )}
                  >
                    <span className='text-muted-foreground w-8 shrink-0 text-left text-[11px] tabular-nums'>
                      {formatDuration(group.start)}
                    </span>
                    <span className='flex h-5 w-5 shrink-0 items-center justify-center'>{group.icon}</span>
                    <div className='min-w-0 flex-1 text-left'>
                      <div className='flex items-center gap-2'>
                        <span className='truncate text-xs font-medium'>{group.label}</span>
                        {group.count > 1 && (
                          <span className='text-muted-foreground text-[11px] whitespace-nowrap'>
                            (×{group.count})
                          </span>
                        )}
                      </div>
                      {group.end > group.start && (
                        <div className='text-muted-foreground mt-0.5 text-[11px]'>
                          {formatDurationPrecise(group.end - group.start)}
                        </div>
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

function formatDurationPrecise(ms: number): string {
  if (ms < 1000) {
    return `${(ms / 1000).toFixed(4)} s`;
  }
  if (ms < 60_000) {
    return `${(ms / 1000).toFixed(2)} s`;
  }
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}
