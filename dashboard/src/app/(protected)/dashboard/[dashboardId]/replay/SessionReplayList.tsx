'use client';

import { useMemo, useState } from 'react';
import { SessionReplay } from '@/entities/analytics/sessionReplays.entities';
import { Spinner } from '@/components/ui/spinner';
import { Clock, ListVideo } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { DeviceIcon, BrowserIcon, OSIcon, FlagIcon, type FlagIconProps } from '@/components/icons';
import { useLocale, useTranslations } from 'next-intl';
import { getCountryName } from '@/utils/countryCodes';
import { formatDuration, formatRelativeTimeFromNow } from '@/utils/dateFormatters';
import { SessionListPanel, type ListPanelItem } from './SessionListPanel';
import { capitalizeFirstLetter } from '@/utils/formatters';
import { InfoBadge } from './components/InfoBadge';
import { Inline } from '@/components/layout';
import { Caption } from '@/components/text';

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
  const t = useTranslations('components.sessionReplay.sessionList');
  const tMisc = useTranslations('misc');

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
    const country = session?.country_code
      ? {
          code: session.country_code as FlagIconProps['countryCode'],
          name: getCountryName(session.country_code as FlagIconProps['countryCode'], locale),
        }
      : null;
    const browserName = session.browser ? capitalizeFirstLetter(session.browser) : null;
    const osName = session.os ? capitalizeFirstLetter(session.os) : null;
    const deviceName = session.device_type ? capitalizeFirstLetter(session.device_type) : null;

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
              <span>{capitalizeFirstLetter(formatRelativeTimeFromNow(startedAt, locale))}</span>
              <span className='inline-flex items-center gap-1 font-medium'>
                <Clock className='h-3 w-3' aria-hidden='true' />
                {durationLabel}
              </span>
            </div>

            <p className='text-foreground mt-3 w-full truncate text-xs'>{session.start_url || t('unknownUrl')}</p>

            <div className='text-foreground mt-3 flex flex-wrap items-center gap-2 text-xs'>
              <InfoBadge
                tooltip={country?.name ?? tMisc('unknown')}
                ariaLabel={country?.name ?? tMisc('unknown')}
                icon={country?.code && <FlagIcon countryCode={country.code} countryName={country.name} />}
              />
              <InfoBadge
                tooltip={browserName ?? tMisc('unknown')}
                ariaLabel={browserName ?? tMisc('unknown')}
                icon={browserName && <BrowserIcon name={browserName} />}
              />

              <InfoBadge
                tooltip={osName ?? tMisc('unknown')}
                ariaLabel={osName ?? tMisc('unknown')}
                icon={osName && <OSIcon name={osName} />}
              />

              <InfoBadge
                tooltip={deviceName ?? tMisc('unknown')}
                ariaLabel={deviceName ?? tMisc('unknown')}
                icon={deviceName && <DeviceIcon type={deviceName} />}
              />
            </div>
          </CardContent>
        </Card>
      ),
    };
  });

  const emptyState = isLoadingInitial ? (
    <Caption className='flex h-full items-center justify-center px-2'>
      <div className='flex flex-col items-center gap-1'>
        <Spinner size='sm' />
        <span>{t('loading')}</span>
      </div>
    </Caption>
  ) : (
    <Caption className='flex h-full items-center justify-center px-2'>
      <div className='flex flex-col items-center text-center'>
        <ListVideo className='text-muted-foreground/70 mb-3 h-8 w-8' />
        <p className='font-medium'>{t('empty.title')}</p>
        <p className='mt-1 text-xs'>{t('empty.description')}</p>
      </div>
    </Caption>
  );

  return (
    <SessionListPanel
      title={t('header')}
      subtitle={t('subHeader', { count: filteredSessions.length })}
      headerRight={
        <Inline gap='list'>
          <Input
            id='session-duration-filter'
            type='number'
            min={0}
            value={minDurationFilter}
            onChange={handleDurationChange}
            placeholder={t('durationFilter')}
            aria-label={t('durationFilterAria')}
            inputMode='numeric'
            className='cursor-input h-8 w-36 !text-xs shadow-sm md:!text-xs'
          />
        </Inline>
      }
      items={items}
      onReachEnd={onLoadMore}
      isFetchingMore={isFetchingMore}
      hasNextPage={hasNextPage}
      empty={emptyState}
    />
  );
}
