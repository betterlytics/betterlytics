import { BrowserIcon, DeviceIcon, FlagIcon, FlagIconProps, OSIcon } from '@/components/icons';
import { InfoBadge } from './InfoBadge';
import { TooltipProvider } from '@/components/ui/tooltip';
import { capitalizeFirstLetter } from '@/utils/formatters';
import { getCountryName } from '@/utils/countryCodes';
import { useLocale } from 'next-intl';
import { memo } from 'react';
import { formatLocalDateTime } from '@/utils/dateFormatters';
import { useTranslations } from 'next-intl';
import { SessionReplay } from '@/entities/analytics/sessionReplays';

type ReplayTopbarProps = {
  session?: SessionReplay | null;
};

export const ReplayTopbar = memo(function ReplayTopbar({ session }: ReplayTopbarProps) {
  const locale = useLocale();
  const t = useTranslations('components.sessionReplay.playerTopbar');
  const tMisc = useTranslations('misc');

  const startedAtLabel = formatLocalDateTime(session?.started_at, locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const country = session?.country_code
    ? {
        code: session.country_code as FlagIconProps['countryCode'],
        name: getCountryName(session.country_code as FlagIconProps['countryCode'], locale),
      }
    : null;

  const browser = session?.browser ? capitalizeFirstLetter(session.browser) : null;
  const os = session?.os ? capitalizeFirstLetter(session.os) : null;
  const device = session?.device_type ? capitalizeFirstLetter(session.device_type) : null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className='bg-muted/60 border-border/60 flex items-center justify-between border-b px-3 py-2 text-xs'>
        <div className='flex max-w-[400px] items-center gap-1 truncate'>
          {session?.start_url && (
            <div className='flex items-center gap-1 truncate' title={t('startUrlTitle')}>
              <span className='text-muted-foreground/70'>{t('startLabel')}</span>
              <span className='truncate'>{session.start_url}</span>
            </div>
          )}
        </div>

        <div className='text-muted-foreground/80 flex-1 text-center'>{startedAtLabel}</div>

        <div className='flex min-h-7 shrink-0 items-center gap-2'>
          {session && (
            <>
              <InfoBadge
                icon={country?.code && <FlagIcon countryCode={country.code} countryName={country.name} />}
                tooltip={country?.name ?? tMisc('unknown')}
                ariaLabel={country?.name ?? tMisc('unknown')}
              />

              <InfoBadge
                icon={browser && <BrowserIcon name={browser} className='h-3.5 w-3.5' />}
                tooltip={browser ?? tMisc('unknown')}
                ariaLabel={browser ?? tMisc('unknown')}
              />

              <InfoBadge
                icon={os && <OSIcon name={os} className='h-3.5 w-3.5' />}
                tooltip={os ?? tMisc('unknown')}
                ariaLabel={os ?? tMisc('unknown')}
              />

              <InfoBadge
                icon={device && <DeviceIcon type={device} className='h-3.5 w-3.5' />}
                tooltip={device ?? tMisc('unknown')}
                ariaLabel={device ?? tMisc('unknown')}
              />
            </>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
});
