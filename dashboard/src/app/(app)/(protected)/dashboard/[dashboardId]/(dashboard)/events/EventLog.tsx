'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, Clock } from 'lucide-react';
import {
  computeNextEventLogCursor,
  subtractHeldBoundaryEvents,
  EventLogEntry,
} from '@/entities/analytics/events.entities';
import { trpc } from '@/trpc/client';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useQueryFiltersContext } from '@/contexts/QueryFiltersContextProvider';
import { useAllowedQueryFilters } from '@/hooks/use-is-filter-column-allowed';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui-extended/scroll-area';
import { computeScrollState } from '@/components/ba-scroll-container';
import { Spinner } from '@/components/ui/spinner';
import { LiveIndicator } from '@/components/live-indicator';
import { EventLogItem } from '@/components/events/EventLogItem';
import { useLocale, useTranslations } from 'next-intl';
import { formatNumber } from '@/utils/formatters';
import { useInView } from '@/hooks/useInView';

const DEFAULT_PAGE_SIZE = 50;
const NEW_EVENTS_POLL_INTERVAL_MS = 30 * 1000;
// High enough that one poll catches the whole gap; capped by the router's NEW_EVENTS_MAX_LIMIT.
const NEW_EVENTS_POLL_LIMIT = 500;
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
  const locale = useLocale();
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
        // Structural sharing would recreate row objects, breaking the WeakMap row keys.
        structuralSharing: false,
      },
    );

  const { data: totalCount } = trpc.events.totalEventCount.useQuery(input, {
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  const allEvents: EventLogEntry[] = useMemo(() => data?.pages.flatMap((page) => page.events) ?? [], [data]);

  // Refresh relative timestamps only when the list changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const now = useMemo(() => Date.now(), [data]);

  const utils = trpc.useUtils();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);
  const attachScrollRef = useCallback((el: HTMLDivElement | null) => {
    scrollRef.current = el;
    setScrollEl(el);
  }, []);
  const allEventsRef = useRef<EventLogEntry[]>([]);
  allEventsRef.current = allEvents;

  // Rows have no unique id, so key them by object identity.
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
  // Stays mounted once shown so dismissal can animate out.
  const [newEventsBadge, setNewEventsBadge] = useState<{ count: number; visible: boolean } | null>(null);

  const dismissBadge = () => setNewEventsBadge((badge) => (badge ? { ...badge, visible: false } : badge));
  const [isAtTop, setIsAtTop] = useState(true);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const prependScrollHeightRef = useRef<number | null>(null);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const badgeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { canScrollUp, canScrollDown } = computeScrollState({
      scrollTop: el.scrollTop,
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
    });
    setIsAtTop(!canScrollUp);
    setCanScrollDown(canScrollDown);
  }, []);

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (!el) return;
    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);
    return () => observer.disconnect();
  }, [updateScrollState, allEvents]);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    const id = setInterval(async () => {
      if (document.hidden || inFlight) return;
      const since = allEventsRef.current[0]?.timestamp ?? null;
      if (!since) {
        void utils.events.recentEvents.refetch({ ...input, limit: pageSize });
        return;
      }
      inFlight = true;
      try {
        const fresh = await utils.client.events.newEvents.query({ ...input, since, limit: NEW_EVENTS_POLL_LIMIT });
        if (cancelled || fresh.length === 0) return;
        if (fresh.length >= NEW_EVENTS_POLL_LIMIT) {
          // Too many new events to prepend — swap in a fresh first page instead.
          const events = fresh.slice(0, pageSize);
          utils.events.recentEvents.setInfiniteData({ ...input, limit: pageSize }, () => ({
            pages: [{ events, nextCursor: computeNextEventLogCursor(events, null, pageSize) }],
            pageParams: [null],
          }));
          scrollRef.current?.scrollTo({ top: 0 });
          void utils.events.totalEventCount.invalidate(input);
          return;
        }

        const newRows = subtractHeldBoundaryEvents(fresh, allEventsRef.current, since);
        if (newRows.length === 0) return;

        // Keep the scroll position stable when the user is scrolled down.
        const el = scrollRef.current;
        if (el && el.scrollTop > 10) {
          prependScrollHeightRef.current = el.scrollHeight;
        }

        setNewUids(new Set(newRows.map(getUid)));
        utils.events.recentEvents.setInfiniteData({ ...input, limit: pageSize }, (old) => {
          if (!old) return old;
          const [first, ...rest] = old.pages;
          return {
            ...old,
            pages: [{ ...first, events: [...newRows, ...first.events] }, ...rest],
          };
        });
        setNewEventsBadge({ count: newRows.length, visible: true });
        utils.events.totalEventCount.setData(input, (old) => (old === undefined ? old : old + newRows.length));

        if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
        highlightTimeoutRef.current = setTimeout(() => setNewUids(new Set()), NEW_EVENTS_HIGHLIGHT_MS);
        if (badgeTimeoutRef.current) clearTimeout(badgeTimeoutRef.current);
        badgeTimeoutRef.current = setTimeout(dismissBadge, NEW_EVENTS_BADGE_MS);
      } catch {
        // Next poll retries.
      } finally {
        inFlight = false;
      }
    }, NEW_EVENTS_POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
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
    root: scrollEl,
    rootMargin: '800px',
    threshold: 0,
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
    <Card className='border-border/50 relative overflow-hidden pb-0 shadow-sm'>
      <div className='absolute top-0 left-0 h-1 w-full animate-pulse bg-linear-to-r from-green-500/20 via-green-400/40 to-green-500/20' />

      <CardHeader>
        <CardTitle className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex min-w-0 items-center gap-3'>
            <div className='bg-muted/50 border-border/30 relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border'>
              <Clock className='text-primary h-4 w-4' />
              <LiveIndicator />
            </div>
            <div className='flex min-w-0 flex-col'>
              <span className='text-lg leading-none font-semibold'>{t('title')}</span>
              <span className='text-muted-foreground mt-0.5 text-xs leading-none font-normal'>
                {t('description')}
              </span>
            </div>
            <div className='ml-2 flex shrink-0 items-center gap-2'></div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className='p-0'>
        <div className='relative'>
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
              'pointer-events-none absolute inset-x-0 top-0 z-10 h-2.5 bg-linear-to-b from-black/5 to-transparent transition-opacity duration-200 dark:from-black/25',
              isAtTop ? 'opacity-0' : 'opacity-100',
            )}
          />
          {newEventsBadge && (
            <div
              aria-hidden={!newEventsBadge.visible}
              className={cn(
                'absolute top-2 left-1/2 z-10 -translate-x-1/2 transition-[opacity,translate] duration-300',
                newEventsBadge.visible
                  ? 'translate-y-0 opacity-100'
                  : 'pointer-events-none -translate-y-1 opacity-0',
              )}
            >
              <button
                type='button'
                tabIndex={newEventsBadge.visible ? undefined : -1}
                onClick={() => {
                  const el = scrollRef.current;
                  if (el) {
                    // Jump most of the way so the smooth scroll stays short.
                    const glideDistance = el.clientHeight * 2;
                    if (el.scrollTop > glideDistance) el.scrollTop = glideDistance;
                    el.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                  dismissBadge();
                }}
                className='bg-primary text-primary-foreground inline-flex cursor-pointer items-center gap-1 rounded-full px-3 py-1 text-xs font-medium shadow-md'
              >
                {!isAtTop && <ArrowUp className='h-3 w-3' aria-hidden='true' />}
                {t('newEvents', { count: newEventsBadge.count })}
              </button>
            </div>
          )}
          {/* Scroll anchoring off since we compensate scroll ourselves; max-h must sit on the viewport. */}
          <ScrollArea
            viewportRef={attachScrollRef}
            onViewportScroll={updateScrollState}
            viewportClassName='max-h-128 [overflow-anchor:none]'
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
                      <EventLogItem event={event} now={now} />
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
          </ScrollArea>
          <div
            aria-hidden='true'
            className={cn(
              'pointer-events-none absolute inset-x-0 bottom-0 h-1.5 bg-linear-to-t from-black/5 to-transparent transition-opacity duration-200 dark:from-black/25',
              canScrollDown ? 'opacity-100' : 'opacity-0',
            )}
          />
        </div>
        {totalCount !== undefined && totalCount > 0 && (
          <div className='border-border/60 text-muted-foreground border-t py-2.5 text-center text-xs font-medium'>
            {allEvents.length >= totalCount
              ? t('showingAll', { count: formatNumber(totalCount, locale) })
              : t('showingPartial', {
                  loaded: formatNumber(allEvents.length, locale),
                  total: formatNumber(totalCount, locale),
                })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
