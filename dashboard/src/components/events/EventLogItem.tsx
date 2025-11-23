import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Activity, ExternalLink, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EventLogEntry } from '@/entities/events';
import { formatRelativeTimeFromNow } from '@/utils/dateFormatters';
import { DeviceIcon, BrowserIcon, FlagIcon, FlagIconProps } from '@/components/icons';
import { useLocale } from 'next-intl';
import { getCountryName } from '@/utils/countryCodes';

const MAX_PROPERTIES_DISPLAY = 3;

interface EventLogItemProps {
  event: EventLogEntry;
  isNearEnd?: boolean;
  onRef?: (node: HTMLDivElement | null) => void;
  icon?: LucideIcon;
}

const formatEventProperties = (jsonString: string) => {
  try {
    const props = JSON.parse(jsonString);
    return Object.entries(props)
      .slice(0, MAX_PROPERTIES_DISPLAY)
      .map(([key, value]) => (
        <Badge key={key} variant='secondary' className='border-border border text-xs font-normal shadow-xs'>
          <span className='text-muted-foreground'>{key}:</span>
          <span className='ml-1'>{String(value)}</span>
        </Badge>
      ));
  } catch {
    return null;
  }
};

const formatUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname + urlObj.search;
    return path.length > 40 ? `${path.slice(0, 37)}...` : path;
  } catch {
    return url.length > 40 ? `${url.slice(0, 37)}...` : url;
  }
};

const MetadataItem = React.memo(
  ({
    icon,
    children,
    className = '',
  }: {
    icon: React.ComponentType<{ className?: string }> | React.ReactElement;
    children: React.ReactNode;
    className?: string;
  }) => {
    return (
      <div className={`text-muted-foreground flex items-center gap-1.5 ${className}`}>
        {React.isValidElement(icon)
          ? icon
          : React.createElement(icon as React.ComponentType<{ className?: string }>, { className: 'h-3.5 w-3.5' })}
        {children}
      </div>
    );
  },
);

MetadataItem.displayName = 'MetadataItem';

export const EventLogItem = React.memo(function EventLogItem({
  event,
  isNearEnd,
  onRef,
  icon,
}: EventLogItemProps) {
  const locale = useLocale();
  const EventIcon = React.useMemo(() => icon ?? Activity, [icon]);

  return (
    <div
      className='group hover:bg-muted/40 hover:border-l-primary/50 relative border-l-2 border-l-transparent p-4 transition-all duration-200'
      ref={isNearEnd ? onRef : null}
    >
      <div className='relative flex items-start gap-4'>
        <div className='bg-muted/50 border-border/30 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border'>
          <EventIcon className='text-primary h-3.5 w-3.5' />
        </div>

        <div className='min-w-0 flex-1 space-y-3'>
          <div className='flex items-center justify-between gap-3'>
            <div className='flex items-center gap-2'>
              <h3 className='text-foreground text-sm leading-tight font-semibold'>{event.event_name}</h3>
              <div className='bg-muted-foreground/40 h-1 w-1 rounded-full' />
              <Badge variant='secondary' className='border-border border text-xs font-medium shadow-xs'>
                {formatRelativeTimeFromNow(event.timestamp)}
              </Badge>
            </div>
          </div>

          <div className='flex flex-wrap items-center gap-4 text-xs'>
            {event.visitor_id && (
              <MetadataItem icon={User}>
                <span className='bg-muted/60 rounded px-1.5 py-0.5 font-mono text-[10px] font-medium'>
                  {event.visitor_id.slice(-6)}
                </span>
              </MetadataItem>
            )}

            <MetadataItem icon={<DeviceIcon type={event.device_type} />}>
              <span className='capitalize'>{event.device_type}</span>
            </MetadataItem>

            {event.browser && (
              <MetadataItem icon={<BrowserIcon name={event.browser} />}>
                <span className='capitalize'>{event.browser}</span>
              </MetadataItem>
            )}

            {event.country_code && (
              <MetadataItem
                icon={
                  <FlagIcon
                    countryCode={event.country_code as FlagIconProps['countryCode']}
                    countryName={getCountryName(event.country_code, locale)}
                  />
                }
              >
                <span className='font-medium uppercase'>{event.country_code}</span>
              </MetadataItem>
            )}

            <MetadataItem icon={ExternalLink}>
              <span className='bg-muted/60 rounded px-1.5 py-0.5 font-mono text-[10px] font-medium shadow-xs'>
                {formatUrl(event.url)}
              </span>
            </MetadataItem>
          </div>

          {event.custom_event_json && event.custom_event_json !== '{}' && (
            <div className='flex flex-wrap gap-2 pt-1'>{formatEventProperties(event.custom_event_json)}</div>
          )}
        </div>
      </div>
    </div>
  );
});
