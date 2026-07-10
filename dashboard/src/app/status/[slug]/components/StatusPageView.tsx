'use client';

import '@/app/status/[slug]/status.css';
import type { CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import type { PublicStatusPageData } from '@/entities/analytics/statusPage/publicStatusPage.entities';
import { formatLocalDateTime } from '@/utils/dateFormatters';
import { accentForeground } from '@/utils/colorUtils';
import { cn } from '@/lib/utils';
import { useDisplayTimeZone } from '@/app/status/[slug]/useDisplayTimeZone';
import { useDisplayHour12 } from '@/hooks/use-display-hour12';
import { BrandHeader } from './BrandHeader';
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
      className='bl-status-page @container min-h-screen bg-[var(--sp-page-bg)] font-sans antialiased'
      style={
        {
          '--sp-accent': data.accentColor,
          '--sp-accent-foreground': accentForeground(data.accentColor),
        } as CSSProperties
      }
    >
      <BrandHeader
        name={data.name}
        logoUrl={data.logoUrl}
        homepageUrl={data.homepageUrl}
        tall={data.monitors.length > 0}
      />
      <main className='mx-auto w-full max-w-3xl px-4 pb-10 @min-[640px]:px-8'>
        {/* Overlap sized so the band edge lands inside the first monitor row (the hero
            above it is ~190px), mirroring the tall pb on the band. */}
        <div
          className={cn(
            'rounded-xl [box-shadow:var(--sp-card-shadow)]',
            data.monitors.length > 0 ? '-mt-59' : '-mt-11',
          )}
        >
          <StatusHero
            overallStatus={data.overallStatus}
            bannerLabel={t(`banner.${data.overallStatus}`)}
            subTextLabel={subTextLabel}
            className={cn('rounded-t-xl', data.monitors.length > 0 ? 'border-b-0' : 'rounded-b-xl')}
          />
          {data.monitors.length > 0 && (
            <div className='overflow-hidden rounded-b-xl border border-t-0 border-[var(--sp-card-border)] bg-[var(--sp-card-bg)]'>
              <MonitorUptimeCard data={data} />
            </div>
          )}
        </div>
        {data.incidents !== null && <Incidents data={data} />}
        {!data.hideBranding && (
          <footer className='mt-8 text-center text-sm text-[var(--sp-muted)]'>
            {t('poweredBy')}{' '}
            <a
              href='https://betterlytics.io'
              target='_blank'
              rel='noopener noreferrer'
              className='ml-0.5 inline-flex items-center gap-1 align-middle font-bold text-[var(--sp-muted)] hover:underline'
            >
              <span aria-hidden className='bl-status-logo h-4 w-4' />
              Betterlytics
            </a>
          </footer>
        )}
      </main>
    </div>
  );
}
