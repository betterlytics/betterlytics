'use client';

import type { eventWithTime } from '@rrweb/types';
import { memo, useMemo } from 'react';
import { EventType, IncrementalSource } from '@rrweb/types';
import { TimelinePanel } from '@/app/dashboard/[dashboardId]/replay/TimelinePanel';
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
  PlayCircle,
  Expand,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { markerFillColorForLabel } from '@/app/dashboard/[dashboardId]/replay/utils/colors';

export type TimelineMarkerDescriptor = {
  label: string;
  timestamp: number;
  icon?: React.ReactNode;
};

export type TimelineMarker = TimelineMarkerDescriptor & {
  id: string;
};

export type TimelineGroup = {
  id: string;
  label: string;
  count: number;
  start: number;
  end: number;
  jumpTo: number;
  icon: React.ReactNode;
};

type ReplayTimelineProps = {
  markers: TimelineMarker[];
  onJump: (timestamp: number) => void;
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

        if (source === IncrementalSource.ViewportResize) {
          return {
            label: 'Viewport Resize',
            timestamp: timeFromStart,
          } satisfies TimelineMarkerDescriptor;
        }

        if (source === IncrementalSource.MediaInteraction) {
          return {
            label: 'Media Interaction',
            timestamp: timeFromStart,
          } satisfies TimelineMarkerDescriptor;
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

function iconForLabel(label: string, theme: 'light' | 'dark'): React.ReactNode {
  const ICON_BASE_CLASS = 'h-5 w-5';

  const color = markerFillColorForLabel(theme, label);

  switch (label) {
    case 'Mouse Interaction':
      return <MousePointer2 className={ICON_BASE_CLASS} style={{ color }} />;
    case 'Selection':
      return <MousePointerSquareDashed className={ICON_BASE_CLASS} style={{ color }} />;
    case 'Scroll':
      return <ScrollText className={ICON_BASE_CLASS} style={{ color }} />;
    case 'Input':
      return <Keyboard className={ICON_BASE_CLASS} style={{ color }} />;
    case 'Full snapshot':
      return <Camera className={ICON_BASE_CLASS} style={{ color }} />;
    case 'Viewport Resize':
      return <Expand className={ICON_BASE_CLASS} style={{ color }} />;
    case 'Media Interaction':
      return <PlayCircle className={ICON_BASE_CLASS} style={{ color }} />;
    case 'Pageview':
      return <Eye className={ICON_BASE_CLASS} style={{ color }} />;
    case 'Blacklist':
      return <Lock className={ICON_BASE_CLASS} style={{ color }} />;
    default:
      return <Tag className={ICON_BASE_CLASS} style={{ color }} />;
  }
}

function buildGroups(markers: TimelineMarker[], theme: 'light' | 'dark'): TimelineGroup[] {
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
        icon: iconForLabel(m.label, theme),
      };
      groups.push(current);
    } else {
      current.count += 1;
      current.end = m.timestamp;
    }
  });

  return groups;
}

function ReplayTimelineComponent({ markers, onJump, isSessionSelected = false }: ReplayTimelineProps) {
  const t = useTranslations('components.sessionReplay.eventTimeline');

  const { resolvedTheme } = useTheme();
  const theme: 'light' | 'dark' = resolvedTheme === 'dark' ? 'dark' : 'light';

  const groups = useMemo(() => buildGroups(markers, theme), [markers, theme]);
  const totalEvents = markers.length;

  const timelineEmptyState = useMemo(
    () => (
      <div className='text-muted-foreground flex h-full items-center justify-center px-4 py-10 text-xs'>
        {isSessionSelected ? t('emptyReplay.title') : t('emptyReplay.noSessionSelected')}
      </div>
    ),
    [t, isSessionSelected],
  );

  return (
    <TimelinePanel
      title={t('header')}
      subtitle={t('subHeader', { count: totalEvents, groupCount: groups.length })}
      groups={groups}
      empty={timelineEmptyState}
      rowHeight={44}
      onJump={onJump}
    />
  );
}

export const ReplayTimeline = memo(ReplayTimelineComponent);
