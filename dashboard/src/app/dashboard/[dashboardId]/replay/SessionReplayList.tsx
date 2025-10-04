'use client';

import { useMemo, useState } from 'react';

import { SessionReplay } from '@/entities/sessionReplays';
import { Spinner } from '@/components/ui/spinner';
import { Clock, HelpCircle, ListVideo } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { DeviceIcon, BrowserIcon, OSIcon, FlagIcon, type FlagIconProps } from '@/components/icons';
import { useLocale } from 'next-intl';
import { getCountryName } from '@/utils/countryCodes';
import { formatDistanceToNow } from 'date-fns';
import { formatDuration } from '@/utils/dateFormatters';
import { SessionListPanel, type ListPanelItem } from './SessionListPanel';
import { capitalizeFirstLetter } from '@/utils/formatters';

type SessionReplayListProps = {
  sessions: SessionReplay[];
  selectedSessionId?: string;
  onSelect: (session: SessionReplay) => void;
  onLoadMore?: () => void;
  isFetchingMore?: boolean;
  hasNextPage?: boolean;
  isLoadingInitial?: boolean;
};

export function SessionReplayList({
  sessions,
  selectedSessionId,
  onSelect,
  onLoadMore,
  isFetchingMore,
  hasNextPage,
  isLoadingInitial,
}: SessionReplayListProps) {
  const locale = useLocale();
  const [minDurationFilter, setMinDurationFilter] = useState('');

  const normalizedMinDuration = Math.max(0, Number.parseInt(minDurationFilter || '0', 10) || 0);

  const filteredSessions = useMemo(
    () => sessions.filter((s) => s.duration >= normalizedMinDuration),
    [sessions, normalizedMinDuration],
  );

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === '') {
      setMinDurationFilter('');
      return;
    }

    const nextValue = Number.parseInt(value, 10);
    if (Number.isFinite(nextValue) && nextValue >= 0) {
      setMinDurationFilter(String(nextValue));
    }
  };

  const items: ListPanelItem[] = filteredSessions.map((session) => {
    const startedAt = new Date(session.started_at);
    const durationLabel = formatDuration(session.duration);
    const countryName = session.country_code ? getCountryName(session.country_code, locale) : null;

    return {
      id: session.session_id,
      content: (
        <Card
          role='button'
          tabIndex={0}
          onClick={() => onSelect(session)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSelect(session);
            }
          }}
          aria-pressed={selectedSessionId === session.session_id}
          className={cn(
            'border-border/60 bg-muted/40 hover:border-primary/40 hover:bg-primary/10 focus-visible:ring-primary/40 group focus-visible:ring-offset-background flex w-full cursor-pointer flex-col rounded-md transition focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none',
            selectedSessionId === session.session_id && 'border-primary bg-primary/10 hover:bg-primary/20',
            '!gap-0 !py-0',
          )}
        >
          <CardContent className='px-3 py-3'>
            <div className='text-muted-foreground flex w-full items-center justify-between gap-3 text-xs'>
              <span>{capitalizeFirstLetter(formatDistanceToNow(startedAt, { addSuffix: true }))}</span>
              <span className='inline-flex items-center gap-1 font-medium'>
                <Clock className='h-3 w-3' aria-hidden='true' />
                {durationLabel}
              </span>
            </div>

            <p className='text-foreground mt-3 w-full truncate text-xs'>{session.start_url || 'Unknown URL'}</p>

            <div className='text-foreground mt-3 flex flex-wrap items-center gap-2 text-xs'>
              {session.country_code ? (
                <SessionDataIconBadge
                  title={countryName ?? 'Unknown'}
                  ariaLabel={countryName ? `Country ${countryName}` : 'Unknown'}
                >
                  <FlagIcon
                    countryCode={session.country_code as FlagIconProps['countryCode']}
                    countryName={countryName ?? ''}
                  />
                </SessionDataIconBadge>
              ) : (
                <EmptySessionData />
              )}
              {session.browser ? (
                <SessionDataIconBadge
                  title={`Browser ${session.browser}`}
                  ariaLabel={`Browser ${session.browser}`}
                >
                  <BrowserIcon name={session.browser} />
                </SessionDataIconBadge>
              ) : (
                <EmptySessionData />
              )}
              {session.os ? (
                <SessionDataIconBadge title={`OS ${session.os}`} ariaLabel={`OS ${session.os}`}>
                  <OSIcon name={session.os} />
                </SessionDataIconBadge>
              ) : (
                <EmptySessionData />
              )}
              {session.device_type ? (
                <SessionDataIconBadge
                  title={`Device ${session.device_type}`}
                  ariaLabel={`Device ${session.device_type}`}
                >
                  <DeviceIcon type={session.device_type} />
                </SessionDataIconBadge>
              ) : (
                <EmptySessionData />
              )}
            </div>
          </CardContent>
        </Card>
      ),
    };
  });

  const emptyState = isLoadingInitial ? (
    <div className='text-muted-foreground flex h-full items-center justify-center px-2 text-xs'>
      <div className='flex flex-col items-center gap-1'>
        <Spinner size='sm' />
        <span>Loading sessions…</span>
      </div>
    </div>
  ) : (
    <div className='text-muted-foreground flex h-full items-center justify-center px-2 text-xs'>
      <div className='flex flex-col items-center'>
        <ListVideo className='text-muted-foreground/70 mb-3 h-8 w-8' />
        <p className='font-medium'>No session replays available</p>
        <p className='mt-1 text-xs'>Try expanding your time range or adjusting filters.</p>
      </div>
    </div>
  );

  return (
    <SessionListPanel
      title='Sessions'
      subtitle={`${filteredSessions.length} sessions`}
      headerRight={
        <div className='flex items-center gap-2'>
          <Input
            id='session-duration-filter'
            type='number'
            min={0}
            value={minDurationFilter}
            onChange={handleDurationChange}
            placeholder='Min duration (s)'
            aria-label='Filter sessions by minimum duration in seconds'
            inputMode='numeric'
            className='cursor-input h-8 w-36 !text-xs shadow-sm md:!text-xs'
          />
        </div>
      }
      items={items}
      onReachEnd={onLoadMore}
      isFetchingMore={isFetchingMore}
      hasNextPage={hasNextPage}
      empty={emptyState}
    />
  );
}

function SessionDataIconBadge({
  children,
  title,
  ariaLabel,
}: {
  children: React.ReactNode;
  title: string;
  ariaLabel: string;
}) {
  return (
    <span
      className='border-border/50 bg-muted/40 flex h-7 w-7 items-center justify-center rounded-md border'
      title={title}
      aria-label={ariaLabel}
    >
      {children}
    </span>
  );
}

function EmptySessionData() {
  return (
    <SessionDataIconBadge title='Unknown' ariaLabel='Unknown'>
      <HelpCircle size='1rem' />
    </SessionDataIconBadge>
  );
}
