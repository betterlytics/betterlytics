'use client';

import { useMemo, useState } from 'react';

import { SessionReplay } from '@/entities/sessionReplays';
import { Clock, ListVideo } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { DeviceIcon, BrowserIcon, OSIcon, FlagIcon, type FlagIconProps } from '@/components/icons';
import { useLocale } from 'next-intl';
import { getCountryName } from '@/utils/countryCodes';
import { formatDistanceToNow } from 'date-fns';
import { formatDuration } from '@/utils/dateFormatters';
import { SessionListPanel, type ListPanelItem } from './SessionListPanel';

type SessionReplayListProps = {
  sessions: SessionReplay[];
  selectedSessionId?: string;
  onSelect: (session: SessionReplay) => void;
};

export function SessionReplayList({ sessions, selectedSessionId, onSelect }: SessionReplayListProps) {
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
              <span>Started {formatDistanceToNow(startedAt, { addSuffix: true })}</span>
              <span className='inline-flex items-center gap-1 font-medium'>
                <Clock className='h-3 w-3' aria-hidden='true' />
                {durationLabel}
              </span>
            </div>

            <p className='text-foreground mt-2 w-full truncate text-sm font-semibold'>
              {session.start_url || 'Unknown URL'}
            </p>

            <div className='text-muted-foreground mt-3 flex flex-wrap items-center gap-2 text-xs'>
              {session.country_code ? (
                <span
                  className='border-border/50 bg-muted/40 flex h-7 w-7 items-center justify-center rounded-md border'
                  title={countryName ?? undefined}
                  aria-label={countryName ? `Country ${countryName}` : undefined}
                >
                  <FlagIcon
                    countryCode={session.country_code as FlagIconProps['countryCode']}
                    countryName={countryName ?? ''}
                  />
                </span>
              ) : null}
              {session.browser ? (
                <span
                  className='border-border/50 bg-muted/40 flex h-7 w-7 items-center justify-center rounded-md border'
                  title={`Browser ${session.browser}`}
                  aria-label={`Browser ${session.browser}`}
                >
                  <BrowserIcon name={session.browser} />
                </span>
              ) : null}
              {session.os ? (
                <span
                  className='border-border/50 bg-muted/40 flex h-7 w-7 items-center justify-center rounded-md border'
                  title={`OS ${session.os}`}
                  aria-label={`OS ${session.os}`}
                >
                  <OSIcon name={session.os} />
                </span>
              ) : null}
              {session.device_type ? (
                <span
                  className='border-border/50 bg-muted/40 flex h-7 w-7 items-center justify-center rounded-md border'
                  title={`Device ${session.device_type}`}
                  aria-label={`Device ${session.device_type}`}
                >
                  <DeviceIcon type={session.device_type} />
                </span>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ),
    };
  });

  const emptyState = (
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
      empty={emptyState}
    />
  );
}
