'use client';

import type { eventWithTime } from '@rrweb/types';
import { memo, useMemo } from 'react';
import { EventType, IncrementalSource } from '@rrweb/types';
import { ListPanel } from '@/app/dashboard/[dashboardId]/replay/ListPanel';
import {
  MousePointer2,
  MousePointerSquareDashed,
  FilePen,
  ScrollText,
  Route,
  Keyboard,
  Eye,
  Tag,
  Camera,
  Lock,
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
  onJump: (timestamp: number) => void;
  className?: string;
  isSessionSelected?: boolean;
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
          return null;
        }

        if (source === IncrementalSource.Input) {
          const data = event.data as Record<string, unknown> | undefined;
          const hasTextChange = Boolean(data && 'text' in data);
          const hasCheckedChange = Boolean(data && 'isChecked' in data);
          if (!hasTextChange && !hasCheckedChange) {
            return null;
          }

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
      return <Camera className={`${ICON_BASE_CLASS} text-green-500 dark:text-green-400`} />;
    case 'Pageview':
      return <Eye className={`${ICON_BASE_CLASS} text-sky-500 dark:text-sky-400`} />;
    case 'Blacklist':
      return <Lock className={`${ICON_BASE_CLASS} text-gray-500 dark:text-gray-400`} />;
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
        id: `group-${index}-${m.label}-${Math.round(m.timestamp)}`,
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

function ReplayTimelineComponent({ markers, onJump, className, isSessionSelected = false }: ReplayTimelineProps) {
  const groups = useMemo(() => buildGroups(markers), [markers]);
  const totalEvents = markers.length;

  const timelineEmptyState = (
    <div className='text-muted-foreground flex h-full items-center justify-center px-4 py-10 text-xs'>
      {isSessionSelected ? 'No key events detected in this replay yet.' : 'Select a replay to view its timeline.'}
    </div>
  );

  return (
    <ListPanel
      title='Timeline'
      subtitle={`${totalEvents} events captured (${groups.length} groups)`}
      groups={groups}
      empty={timelineEmptyState}
      className={className}
      rowHeight={44}
      onJump={onJump}
    />
  );
}

export const ReplayTimeline = memo(ReplayTimelineComponent);
