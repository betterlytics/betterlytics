'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { ExternalLink, Film, MousePointerClick, AlertTriangle, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from 'next-themes';
import { fetchSessionTrailAction, checkSessionReplayAction } from '@/app/actions/analytics/errors.actions';
import type { GroupedSessionTrailEvent } from '@/entities/analytics/errors.entities';
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

export function SessionTrail({ dashboardId, sessionId, currentFingerprint }: SessionTrailProps) {
  const [groups, setGroups] = useState<GroupedSessionTrailEvent[] | null>(null);
  const [hasReplay, setHasReplay] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light';

  const currentRef = useCallback((node: HTMLDivElement | null) => {
    if (node) {
      node.scrollIntoView({ block: 'center' });
    }
  }, []);

  useEffect(() => {
    startTransition(async () => {
      const [data, replay] = await Promise.all([
        fetchSessionTrailAction(dashboardId, sessionId),
        checkSessionReplayAction(dashboardId, sessionId),
      ]);
      setGroups(data);
      setHasReplay(replay);
    });
  }, [dashboardId, sessionId]);

  if (isPending || !groups) {
    return (
      <div className='space-y-3'>
        <Skeleton className='h-4 w-24' />
        <div className='space-y-1'>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className='flex items-center gap-3 py-2'>
              <Skeleton className='h-3 w-12' />
              <Skeleton className='h-5 w-5 rounded' />
              <Skeleton className='h-3.5 w-48' />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (groups.length === 0) return null;

  const totalEvents = groups.reduce((sum, g) => sum + g.count, 0);

  return (
    <div className='space-y-3'>
      <div className='flex items-center justify-between gap-3'>
        <div className='space-y-1'>
          <p className='text-base font-medium'>Session trail</p>
          <p className='text-muted-foreground text-xs leading-relaxed'>
            {totalEvents} {totalEvents === 1 ? 'event' : 'events'} in this session
          </p>
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
      </div>
      <div className='relative'>
        <div className='bg-muted/50 ring-border/60 max-h-80 overflow-y-auto rounded-lg p-1 shadow-inner ring-1 ring-inset'>
          {groups.map(({ event, count, label }, i) => {
            const Icon = EVENT_ICONS[event.event_type] ?? Eye;
            const color = EVENT_COLORS[theme][event.event_type] ?? EVENT_COLORS[theme].pageview;
            const isCurrent = event.event_type === 'js_error' && event.error_fingerprint === currentFingerprint;
            const isLast = i === groups.length - 1;

            return (
              <div
                key={i}
                ref={isCurrent ? currentRef : undefined}
                className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-xs transition-colors ${
                  isCurrent ? 'bg-destructive/8 shadow-[inset_2px_0_0_0_var(--destructive)]' : 'hover:bg-muted'
                }`}
              >
                <span className='text-muted-foreground w-16 shrink-0 text-left text-[11px] tabular-nums'>
                  {formatLocalDateTime(event.timestamp, undefined, { timeStyle: 'medium' })}
                </span>
                <span className='relative flex h-5 w-5 shrink-0 items-center justify-center'>
                  {!isLast && <span className='bg-border absolute top-full h-[calc(100%+8px)] w-px' />}
                  <Icon className='relative z-10 h-4 w-4' style={{ color }} />
                </span>
                <span className='flex min-w-0 flex-1 items-center gap-1.5'>
                  <span className='truncate text-xs font-medium'>{label}</span>
                  {count > 1 && (
                    <Badge variant='secondary' className='shrink-0 rounded-full text-[10px] font-normal'>
                      x{count}
                    </Badge>
                  )}
                </span>
              </div>
            );
          })}
        </div>
        <div className='pointer-events-none absolute inset-x-0 top-0 h-6 rounded-t-lg bg-gradient-to-b from-black/[0.02] to-transparent dark:from-black/20' />
        <div className='pointer-events-none absolute inset-x-0 bottom-0 h-6 rounded-b-lg bg-gradient-to-t from-black/[0.02] to-transparent dark:from-black/20' />
      </div>
    </div>
  );
}
