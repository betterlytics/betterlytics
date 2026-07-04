'use client';

import '@/app/status/[slug]/status.css';
import type { CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import type { PublicStatusPageData } from '@/entities/analytics/statusPage/publicStatusPage.entities';
import { formatLocalDateTime } from '@/utils/dateFormatters';
import { accentForeground } from '@/components/statusPage/StatusPageBrandAvatar';
import { useDisplayTimeZone } from '@/app/status/[slug]/useDisplayTimeZone';
import { useDisplayHour12 } from '@/hooks/use-display-hour12';
import { Incidents } from './Incidents';
import { MonitorUptimeCard } from './MonitorUptimeCard';
import { StatusHero } from './StatusHero';

export function StatusPageView({ data }: { data: PublicStatusPageData }) {
  const t = useTranslations('publicStatusPage');
  const timeZone = useDisplayTimeZone();
  const hour12 = useDisplayHour12();

  const lastUpdatedTime =
    formatLocalDateTime(data.lastUpdatedAt, 'en', {
      dateStyle: 'medium',
      timeStyle: 'short',
      hour12,
      timeZone,
    }) ?? '';

    const zoneLabel = lastUpdatedTime
    ? new Intl.DateTimeFormat('en', { timeZone, timeZoneName: 'short' })
        .formatToParts(new Date(data.lastUpdatedAt))
        .find((part) => part.type === 'timeZoneName')?.value
    : undefined;
  const lastUpdated = zoneLabel ? `${lastUpdatedTime} ${zoneLabel}` : lastUpdatedTime;

  const subTextLabel =
    data.overallStatus === 'degraded'
      ? `${t('statusNote.degraded')} — ${t('lastUpdatedInline', { date: lastUpdated })}`
      : t('lastUpdated', { date: lastUpdated });

  return (
    <div
      data-sp-theme={data.theme}
      className='bl-status-page min-h-screen bg-[var(--sp-page-bg)] font-sans antialiased'
      style={
        {
          '--sp-accent': data.accentColor,
          '--sp-accent-foreground': accentForeground(data.accentColor),
        } as CSSProperties
      }
    >
      <StatusHero
        name={data.name}
        logoUrl={data.logoUrl}
        homepageUrl={data.homepageUrl}
        overallStatus={data.overallStatus}
        bannerLabel={t(`banner.${data.overallStatus}`)}
        subTextLabel={subTextLabel}
      />
      <main className='mx-auto -mt-11 w-full max-w-3xl px-4 pb-10 sm:px-8'>
        <MonitorUptimeCard data={data} />
        {data.incidents !== null && <Incidents data={data} />}
        {!data.hideBranding && (
          <footer className='mt-8 text-center text-xs text-[var(--sp-faint)]'>
            {t('poweredBy')}{' '}
            <a
              href='https://betterlytics.io'
              target='_blank'
              rel='noopener noreferrer'
              className='ml-0.5 inline-flex items-center gap-1 align-middle font-bold text-[var(--sp-muted)] hover:underline'
            >
              <span aria-hidden className='bl-status-logo h-3.5 w-3.5' />
              Betterlytics
            </a>
          </footer>
        )}
      </main>
    </div>
  );
}
