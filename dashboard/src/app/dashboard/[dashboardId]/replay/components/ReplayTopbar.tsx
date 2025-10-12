'use client';

import { memo, useMemo } from 'react';
import type { SessionReplay } from '@/entities/sessionReplays';
import { DeviceIcon, BrowserIcon, OSIcon, FlagIcon, type FlagIconProps } from '@/components/icons';
import { getCountryName } from '@/utils/countryCodes';
import { useLocale, useTranslations } from 'next-intl';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatLocalDateTime } from '@/utils/dateFormatters';
import { capitalizeFirstLetter } from '@/utils/formatters';

type ReplayTopbarProps = {
  session?: SessionReplay | null;
};

export const ReplayTopbar = memo(function ReplayTopbar({ session }: ReplayTopbarProps) {
  const locale = useLocale();
  const t = useTranslations('components.sessionReplay.playerTopbar');

  const startedAtLabel = useMemo(
    () => formatLocalDateTime(session?.started_at, locale, { dateStyle: 'medium', timeStyle: 'short' }),
    [locale, session?.started_at],
  );

  const country = useMemo(() => {
    const code = session?.country_code as FlagIconProps['countryCode'];
    if (!code) return null;
    return { code, name: getCountryName(code, locale) };
  }, [locale, session?.country_code]);

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

        <div className='flex shrink-0 items-center gap-2'>
          {country && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className='border-border/50 bg-muted/40 flex h-7 w-7 items-center justify-center rounded-md border'
                  aria-label={t('countryAria', { name: country.name ?? country.code })}
                >
                  <FlagIcon countryCode={country.code} countryName={country.name ?? ''} />
                </span>
              </TooltipTrigger>
              <TooltipContent side='bottom'>{country.name ?? country.code}</TooltipContent>
            </Tooltip>
          )}
          {session?.browser && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className='border-border/50 bg-muted/40 flex h-7 w-7 items-center justify-center rounded-md border'
                  aria-label={t('browserAria', { name: session.browser })}
                >
                  <BrowserIcon name={session.browser} className='h-3.5 w-3.5' />
                </span>
              </TooltipTrigger>
              <TooltipContent side='bottom'>{capitalizeFirstLetter(session.browser)}</TooltipContent>
            </Tooltip>
          )}
          {session?.os && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className='border-border/50 bg-muted/40 flex h-7 w-7 items-center justify-center rounded-md border'
                  aria-label={t('osAria', { name: session.os })}
                >
                  <OSIcon name={session.os} className='h-3.5 w-3.5' />
                </span>
              </TooltipTrigger>
              <TooltipContent side='bottom'>{capitalizeFirstLetter(session.os)}</TooltipContent>
            </Tooltip>
          )}
          {session?.device_type && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className='border-border/50 bg-muted/40 flex h-7 w-7 items-center justify-center rounded-md border'
                  aria-label={t('deviceAria', { name: session.device_type })}
                >
                  <DeviceIcon type={session.device_type} className='h-3.5 w-3.5' />
                </span>
              </TooltipTrigger>
              <TooltipContent side='bottom'>{capitalizeFirstLetter(session.device_type)}</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
});
