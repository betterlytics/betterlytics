'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import Link from 'next/link';
import { ExternalLink, Play, MousePointerClick, AlertTriangle, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from 'next-themes';
import { fetchSessionTrailAction, checkSessionReplayAction } from '@/app/actions/analytics/errors.actions';
import type { GroupedSessionTrailEvent } from '@/entities/analytics/errors.entities';
import { formatLocalDateTime } from '@/utils/dateFormatters';
import { useDashboardNavigation } from '@/contexts/DashboardNavigationContext';
import { useDashboardAuth } from '@/contexts/DashboardAuthProvider';
import { useTranslations } from 'next-intl';

type SessionTrailProps = {
  dashboardId: string;
  sessionId: string;
  currentFingerprint: string;
};

type EventConfig = {
  icon: typeof Eye;
  light: string;
  dark: string;
};

const EVENT_CONFIG = {
  pageview: { icon: Eye, light: '#0ea5e9', dark: '#38bdf8' },
  custom: { icon: MousePointerClick, light: '#8b5cf6', dark: '#a78bfa' },
  outbound_link: { icon: ExternalLink, light: '#f97316', dark: '#fb923c' },
  client_error: { icon: AlertTriangle, light: '#ef4444', dark: '#f87171' },
  default: { icon: Eye, light: '#0ea5e9', dark: '#38bdf8' },
} as const satisfies Record<string, EventConfig>;

export function SessionTrail({ dashboardId, sessionId, currentFingerprint }: SessionTrailProps) {
  const t = useTranslations('errors.detail.sessionTrail');
  const [groups, setGroups] = useState<GroupedSessionTrailEvent[] | null>(null);
  const [hasReplay, setHasReplay] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { resolvedTheme } = useTheme();
  const { resolveHref } = useDashboardNavigation();
  const { isDemo } = useDashboardAuth();
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
          <p className='text-base font-medium'>{t('title')}</p>
          <p className='text-muted-foreground text-xs leading-relaxed'>
            {t('eventCount', { count: totalEvents })}
          </p>
        </div>
        {hasReplay && !isDemo && (
          <Link
            href={resolveHref(`/replay?sessionId=${sessionId}`)}
            className='bg-primary text-primary-foreground hover:bg-primary/90 flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors'
          >
            <Play className='full-current h-3.5 w-3.5' />
            {t('watchReplay')}
          </Link>
        )}
      </div>
      <div className='relative'>
        <div className='bg-muted/50 ring-border/60 max-h-80 overflow-y-auto rounded-lg p-1 shadow-inner ring-1 ring-inset'>
          {groups.map(({ event, count, label }, i) => {
            const config = EVENT_CONFIG[event.event_type as keyof typeof EVENT_CONFIG] ?? EVENT_CONFIG.default;
            const Icon = config.icon;
            const color = config[theme];
            const isCurrent =
              event.event_type === 'client_error' && event.error_fingerprint === currentFingerprint;
            const isLast = i === groups.length - 1;

            return (
              <div
                key={i}
                ref={isCurrent ? currentRef : undefined}
                className={cn(
                  'flex w-full items-center gap-3 rounded-md px-2 py-2 text-xs transition-colors',
                  isCurrent ? 'bg-destructive/8 shadow-[inset_2px_0_0_0_var(--destructive)]' : 'hover:bg-muted',
                )}
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
