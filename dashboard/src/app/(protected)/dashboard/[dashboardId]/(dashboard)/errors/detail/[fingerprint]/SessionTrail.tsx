'use client';

import { useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { ExternalLink, Film, MousePointerClick, AlertTriangle, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from 'next-themes';
import { fetchSessionTrailAction, checkSessionReplayAction } from '@/app/actions/analytics/errors.actions';
import type { SessionTrailEvent } from '@/entities/analytics/errors.entities';
import { formatLocalDateTime } from '@/utils/dateFormatters';

type SessionTrailProps = {
  dashboardId: string;
  sessionId: string;
  currentFingerprint: string;
};

const EVENT_ICONS: Record<string, typeof Eye> = {
  pageview: Eye,
  custom: MousePointerClick,
  outbound_link: ExternalLink,
  js_error: AlertTriangle,
};

const EVENT_COLORS: Record<string, Record<string, string>> = {
  light: {
    pageview: '#0ea5e9',
    custom: '#8b5cf6',
    outbound_link: '#f97316',
    js_error: '#ef4444',
  },
  dark: {
    pageview: '#38bdf8',
    custom: '#a78bfa',
    outbound_link: '#fb923c',
    js_error: '#f87171',
  },
};

function getEventLabel(event: SessionTrailEvent): string {
  switch (event.event_type) {
    case 'pageview':
      return event.url || 'Page view';
    case 'custom':
      return event.custom_event_name || 'Custom event';
    case 'outbound_link':
      return event.outbound_link_url || 'Outbound link';
    case 'js_error':
      return `${event.error_type}: ${event.error_message}`;
    default:
      return event.event_type;
  }
}

export function SessionTrail({ dashboardId, sessionId, currentFingerprint }: SessionTrailProps) {
  const [events, setEvents] = useState<SessionTrailEvent[] | null>(null);
  const [hasReplay, setHasReplay] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light';

  useEffect(() => {
    startTransition(async () => {
      const [data, replay] = await Promise.all([
        fetchSessionTrailAction(dashboardId, sessionId),
        checkSessionReplayAction(dashboardId, sessionId),
      ]);
      setEvents(data);
      setHasReplay(replay);
    });
  }, [dashboardId, sessionId]);

  if (isPending || !events) {
    return (
      <Card className='!gap-0 !p-0'>
        <CardHeader className='border-border/60 bg-muted/60 border-b px-4 py-3'>
          <Skeleton className='h-4 w-24' />
        </CardHeader>
        <CardContent className='space-y-1 !px-2 !py-2'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='flex items-center gap-3 px-2 py-2'>
              <Skeleton className='h-3 w-12' />
              <Skeleton className='h-5 w-5 rounded' />
              <Skeleton className='h-3.5 w-48' />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (events.length === 0) return null;

  return (
    <Card className='!gap-0 !p-0'>
      <CardHeader className='border-border/60 bg-muted/60 flex items-center justify-between gap-3 border-b px-4 py-3 !pb-3'>
        <div className='space-y-1'>
          <CardTitle className='text-sm font-medium tracking-tight'>Session trail</CardTitle>
          <CardDescription className='text-xs leading-relaxed'>
            {events.length} {events.length === 1 ? 'event' : 'events'} in this session
          </CardDescription>
        </div>
        {hasReplay && (
          <Link
            href={`/dashboard/${dashboardId}/replay?sessionId=${sessionId}`}
            className='text-primary hover:text-primary/80 flex shrink-0 items-center gap-1.5 text-xs font-medium transition-colors'
          >
            <Film className='h-3.5 w-3.5' />
            Watch replay
          </Link>
        )}
      </CardHeader>
      <CardContent className='!px-2 !py-2'>
        {events.map((event, i) => {
          const Icon = EVENT_ICONS[event.event_type] ?? Eye;
          const color = EVENT_COLORS[theme][event.event_type] ?? EVENT_COLORS[theme].pageview;
          const isCurrent =
            event.event_type === 'js_error' && event.error_fingerprint === currentFingerprint;

          return (
            <div
              key={i}
              className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-xs ${
                isCurrent ? 'bg-destructive/8' : ''
              }`}
            >
              <span className='text-muted-foreground w-16 shrink-0 text-left text-[11px] tabular-nums'>
                {formatLocalDateTime(event.timestamp, undefined, { timeStyle: 'medium' })}
              </span>
              <span className='flex h-5 w-5 shrink-0 items-center justify-center'>
                <Icon className='h-5 w-5' style={{ color }} />
              </span>
              <span className='min-w-0 flex-1 truncate text-xs font-medium'>
                {getEventLabel(event)}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
