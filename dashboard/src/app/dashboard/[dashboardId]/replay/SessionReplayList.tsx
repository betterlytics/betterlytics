'use client';

import { SessionReplay } from '@/entities/sessionReplays';
import { cn } from '@/lib/utils';
import { Clock, HardDrive, ListVideo } from 'lucide-react';
import { DeviceIcon, BrowserIcon, OSIcon, FlagIcon, type FlagIconProps } from '@/components/icons';
import { useLocale } from 'next-intl';
import { getCountryName } from '@/utils/countryCodes';
import { format, formatDistanceToNow } from 'date-fns';
import { SessionListPanel, type ListPanelItem } from './SessionListPanel';

type SessionReplayListProps = {
  sessions: SessionReplay[];
  selectedSessionId?: string;
  onSelect: (session: SessionReplay) => void;
};

export function SessionReplayList({ sessions, selectedSessionId, onSelect }: SessionReplayListProps) {
  const locale = useLocale();
  const headerRight = (
    <div className='flex items-center gap-2'>
      <label htmlFor='duration-seconds' className='text-muted-foreground sr-only'>
        Duration (s)
      </label>
      <input
        id='duration-seconds'
        type='number'
        inputMode='numeric'
        placeholder='Duration (s)'
        className='bg-background border-input text-foreground placeholder:text-muted-foreground/70 focus-visible:ring-primary/40 h-8 w-36 rounded-md border px-2 text-xs outline-none focus-visible:ring-2'
      />
    </div>
  );

  const items: ListPanelItem[] = sessions.map((session) => {
    const startedAt = new Date(session.started_at);
    const endedAt = new Date(session.ended_at);
    const durationLabel = `${Math.floor(session.duration / 60)}m ${session.duration % 60}s`;
    const sizeLabel = `${(session.size_bytes / 1024 / 1024).toFixed(1)} MB`;

    return {
      id: session.session_id,
      content: (
        <button
          type='button'
          onClick={() => onSelect(session)}
          className={cn(
            'border-border/60 group bg-background hover:border-primary/40 flex w-full flex-col rounded-lg border p-3 text-left shadow-sm transition hover:shadow-md',
            selectedSessionId === session.session_id && 'border-primary bg-primary/5 shadow-md',
          )}
        >
          <div className='flex items-center justify-between gap-3'>
            <div className='min-w-0 flex-1'>
              <p className='truncate text-sm font-semibold'>{session.start_url || 'Unknown URL'}</p>
              <p className='text-muted-foreground text-xs'>
                Started {formatDistanceToNow(startedAt, { addSuffix: true })}
              </p>
            </div>
            <span className='text-muted-foreground text-xs font-medium'>#{session.session_id.slice(0, 6)}</span>
          </div>

          <div className='text-muted-foreground mt-3 flex flex-wrap items-center gap-3 text-xs'>
            <span className='inline-flex items-center gap-1'>
              <Clock className='h-3 w-3' /> {durationLabel}
            </span>
            <span className='inline-flex items-center gap-1'>
              <HardDrive className='h-3 w-3' /> {sizeLabel}
            </span>
            {session.device_type && (
              <span className='inline-flex items-center gap-1'>
                <DeviceIcon type={session.device_type} />
                <span className='capitalize'>{session.device_type}</span>
              </span>
            )}
            {session.browser && (
              <span className='inline-flex items-center gap-1'>
                <BrowserIcon name={session.browser} />
                <span className='capitalize'>{session.browser}</span>
              </span>
            )}
            {session.os && (
              <span className='inline-flex items-center gap-1'>
                <OSIcon name={session.os} />
                <span className='capitalize'>{session.os}</span>
              </span>
            )}
            {session.country_code && (
              <span className='inline-flex items-center gap-1'>
                <FlagIcon
                  countryCode={session.country_code as FlagIconProps['countryCode']}
                  countryName={getCountryName(session.country_code, locale)}
                />
                <span className='font-medium uppercase'>{session.country_code}</span>
              </span>
            )}
            <span className='inline-flex items-center gap-1'>
              {format(startedAt, 'PPpp')} – {format(endedAt, 'PPpp')}
            </span>
          </div>
        </button>
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
      subtitle={`${sessions.length} sessions`}
      headerRight={headerRight}
      items={items}
      listClassName='space-y-2'
      empty={emptyState}
    />
  );
}
