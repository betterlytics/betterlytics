'use client';

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { EventLogEntry } from '@/entities/analytics/events.entities';
import { trpc } from '@/trpc/client';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { useAllowedQueryFilters } from '@/hooks/use-is-filter-column-allowed';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { LiveIndicator } from '@/components/live-indicator';
import { EventLogItem } from '@/components/events/EventLogItem';
import { useTranslations } from 'next-intl';
import { useInView } from '@/hooks/useInView';

const DEFAULT_PAGE_SIZE = 25;
const NEW_EVENTS_POLL_INTERVAL_MS = 30 * 1000; // 30 seconds
const NEW_EVENTS_HIGHLIGHT_MS = 2 * 1000;
const NEW_EVENTS_BADGE_MS = 4 * 1000;

type EventLogTranslation = ReturnType<typeof useTranslations<'components.events.log'>>;

interface EventLogProps {
  pageSize?: number;
}

const EmptyState = ({ t }: { t: EventLogTranslation }) => (
  <div className='flex flex-col items-center justify-center space-y-3 py-16'>
    <div className='bg-muted/50 relative flex h-12 w-12 items-center justify-center rounded-full'>
      <Clock className='text-muted-foreground h-6 w-6' />
      <div className='absolute inset-0 animate-pulse rounded-full bg-green-500/10' />
    </div>
    <div className='text-center'>
      <p className='text-foreground text-sm font-medium'>{t('waiting')}</p>
      <p className='text-muted-foreground mt-1 text-xs'>{t('realTimeDesc')}</p>
    </div>
  </div>
);

const LoadingMoreIndicator = ({ t }: { t: EventLogTranslation }) => (
  <div className='border-border/60 bg-muted/10 flex items-center justify-center border-t py-6'>
    <div className='flex items-center gap-3'>
      <Spinner size='sm' />
      <span className='text-muted-foreground text-sm font-medium'>{t('loadingMore')}</span>
    </div>
  </div>
);

export function EventLog({ pageSize = DEFAULT_PAGE_SIZE }: EventLogProps) {
  const t = useTranslations('components.events.log');
  const dashboardId = useDashboardId();
  const { queryFilters } = useQueryFiltersContext();
  const allowedFilters = useAllowedQueryFilters(queryFilters);
  const input = useMemo(() => ({ dashboardId, queryFilters: allowedFilters }), [dashboardId, allowedFilters]);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    trpc.events.recentEvents.useInfiniteQuery(
      { ...input, limit: pageSize },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        staleTime: Infinity,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        // Required by the live prepend: structural sharing re-creates row objects
        // positionally on prepend, which would break WeakMap-based keys.
        structuralSharing: false,
      },
    );

  const allEvents: EventLogEntry[] = useMemo(() => data?.pages.flatMap((page) => page.events) ?? [], [data]);

  const utils = trpc.useUtils();
  const scrollRef = useRef<HTMLDivElement>(null);
  const newestTsRef = useRef<Date | null>(null);
  newestTsRef.current = allEvents[0]?.timestamp ?? null;

  // Rows have no natural unique key, so each row object gets a stable uid
  // (row identity is stable: pages never refetch and structural sharing is off).
  const uidsRef = useRef({ map: new WeakMap<EventLogEntry, string>(), next: 0 });
  const getUid = (e: EventLogEntry) => {
    let uid = uidsRef.current.map.get(e);
    if (uid === undefined) {
      uid = String(uidsRef.current.next++);
      uidsRef.current.map.set(e, uid);
    }
    return uid;
  };
  const [newUids, setNewUids] = useState<Set<string>>(new Set());
  const [newEventsBadge, setNewEventsBadge] = useState<{ count: number } | null>(null);
  const [isAtTop, setIsAtTop] = useState(true);
  const prependScrollHeightRef = useRef<number | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const badgeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const id = setInterval(async () => {
      if (document.hidden) return;
      const since = newestTsRef.current;
      if (!since) {
        // Nothing loaded yet (empty state) — just re-ask for the first page.
        void utils.events.recentEvents.refetch({ ...input, limit: pageSize });
        return;
      }
      const fresh = await utils.client.events.newEvents.query({ ...input, since, limit: pageSize });
      if (fresh.length === 0) return;
      if (fresh.length >= pageSize) {
        // Gap too large to stitch — restart from a fresh first page.
        void utils.events.recentEvents.reset({ ...input, limit: pageSize });
        return;
      }

      // When scrolled down, record the scroll height so the prepend can be
      // compensated and the viewport doesn't jump; at the top, let rows push in.
      const el = scrollRef.current;
      if (el && el.scrollTop > 10) {
        prependScrollHeightRef.current = el.scrollHeight;
      }

      setNewUids(new Set(fresh.map(getUid)));
      utils.events.recentEvents.setInfiniteData({ ...input, limit: pageSize }, (old) => {
        if (!old) return old;
        const [first, ...rest] = old.pages;
        return {
          ...old,
          pages: [{ ...first, events: [...fresh, ...first.events] }, ...rest],
        };
      });
      setNewEventsBadge({ count: fresh.length });

      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
      highlightTimeoutRef.current = setTimeout(() => setNewUids(new Set()), NEW_EVENTS_HIGHLIGHT_MS);
      if (badgeTimeoutRef.current) clearTimeout(badgeTimeoutRef.current);
      badgeTimeoutRef.current = setTimeout(() => setNewEventsBadge(null), NEW_EVENTS_BADGE_MS);
    }, NEW_EVENTS_POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [input, pageSize, utils]);

  useEffect(
    () => () => {
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
      if (badgeTimeoutRef.current) clearTimeout(badgeTimeoutRef.current);
    },
    [],
  );

  useLayoutEffect(() => {
    const el = scrollRef.current;
    const recorded = prependScrollHeightRef.current;
    if (el && recorded !== null) {
      el.scrollTop += el.scrollHeight - recorded;
      prependScrollHeightRef.current = null;
    }
  }, [allEvents]);

  const { ref: loadMoreRef, inView } = useInView<HTMLDivElement>({
    rootMargin: '100px',
    threshold: 0.1,
  });

  const isFetchingRef = useRef(false);

  useEffect(() => {
    // Prevent duplicate fetches
    if (!inView || !hasNextPage || isFetchingNextPage || isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    fetchNextPage();
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  useEffect(() => {
    if (!isFetchingNextPage) {
      isFetchingRef.current = false;
    }
  }, [isFetchingNextPage]);

  return (
    <Card className='border-border/50 relative overflow-hidden shadow-sm'>
      <div className='absolute top-0 left-0 h-1 w-full animate-pulse bg-gradient-to-r from-green-500/20 via-green-400/40 to-green-500/20' />

      <CardHeader className='pb-2'>
        <CardTitle className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex min-w-0 items-center gap-3'>
            <div className='bg-muted/50 border-border/30 relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border'>
              <Clock className='text-primary h-4 w-4' />
              <LiveIndicator />
            </div>
            <div className='flex min-w-0 flex-col'>
              <span className='text-lg font-semibold'>{t('title')}</span>
              <span className='text-muted-foreground text-xs font-normal'>{t('description')}</span>
            </div>
            <div className='ml-2 flex flex-shrink-0 items-center gap-2'></div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className='p-0'>
        <div className='relative'>
          {/* Top-of-list indicator: a hairline while at the top, a shadow scrim once scrolled. */}
          <div
            aria-hidden='true'
            className={cn(
              'border-border/60 pointer-events-none absolute inset-x-0 top-0 z-10 border-t transition-opacity duration-200',
              isAtTop ? 'opacity-100' : 'opacity-0',
            )}
          />
          <div
            aria-hidden='true'
            className={cn(
              'pointer-events-none absolute inset-x-0 top-0 z-10 h-2.5 bg-gradient-to-b from-black/5 to-transparent transition-opacity duration-200 dark:from-black/25',
              isAtTop ? 'opacity-0' : 'opacity-100',
            )}
          />
          {newEventsBadge && (
            <div className='animate-in fade-in slide-in-from-top-1 absolute top-2 left-1/2 z-10 -translate-x-1/2'>
              <button
                type='button'
                onClick={() => {
                  const el = scrollRef.current;
                  if (el) {
                    // Cap the smooth-scroll distance so the glide stays short and consistent
                    // from any depth; beyond that, jump instantly first.
                    const glideDistance = el.clientHeight * 8;
                    if (el.scrollTop > glideDistance) el.scrollTop = glideDistance;
                    el.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                  setNewEventsBadge(null);
                }}
                className='bg-primary text-primary-foreground cursor-pointer rounded-full px-3 py-1 text-xs font-medium shadow-md'
              >
                {t('newEvents', { count: newEventsBadge.count })}
              </button>
            </div>
          )}
          {/* overflow-anchor off: the prepend compensates scroll manually; native anchoring would double it */}
          <div
            ref={scrollRef}
            onScroll={(e) => setIsAtTop(e.currentTarget.scrollTop <= 0)}
            className='scrollbar-thumb-muted max-h-[32rem] scrollbar-thin scrollbar-track-transparent overflow-y-auto [overflow-anchor:none]'
          >
            {isLoading ? (
              <div className='flex flex-col items-center justify-center space-y-3 py-16'>
                <Spinner />
                <p className='text-muted-foreground text-sm'>{t('loading')}</p>
              </div>
            ) : allEvents.length === 0 ? (
              <EmptyState t={t} />
            ) : (
              <>
                <div className='divide-border/60 divide-y'>
                  {allEvents.map((event: EventLogEntry) => (
                    <div
                      key={getUid(event)}
                      className={newUids.has(getUid(event)) ? 'animate-monitor-row-added' : undefined}
                    >
                      <EventLogItem event={event} />
                    </div>
                  ))}
                </div>

                {/* Sentinel element for infinite scroll - only attach ref to this single element */}
                {hasNextPage && <div ref={loadMoreRef} className='h-1' aria-hidden='true' />}

                {isFetchingNextPage && <LoadingMoreIndicator t={t} />}

                {!hasNextPage && allEvents.length > 0 && (
                  <div className='text-muted-foreground border-border/60 border-t py-6 text-center text-xs'>
                    {t('endOfLog')}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
