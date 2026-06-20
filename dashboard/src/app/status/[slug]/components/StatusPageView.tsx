'use client';

import '@/app/status/[slug]/status.css';
import type { CSSProperties } from 'react';
import { useTranslations } from 'next-intl';
import type { PublicStatusPageData } from '@/entities/analytics/statusPage.entities';
import { formatLocalDateTime } from '@/utils/dateFormatters';
import { MonitorUptimeCard } from './MonitorUptimeCard';
import { PastIncidents } from './PastIncidents';
import { StatusHero } from './StatusHero';

function accentForeground(accentHex: string): string {
  const channel = (offset: number) => {
    const c = parseInt(accentHex.slice(offset, offset + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const luminance = 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  return luminance > 0.45 ? '#16181c' : '#ffffff';
}

export function StatusPageView({ data }: { data: PublicStatusPageData }) {
  const t = useTranslations('publicStatusPage');

  const lastUpdated =
    formatLocalDateTime(data.lastUpdatedAt, 'en', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'UTC',
    }) ?? '';

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
        {data.incidents !== null && <PastIncidents data={data} />}
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
