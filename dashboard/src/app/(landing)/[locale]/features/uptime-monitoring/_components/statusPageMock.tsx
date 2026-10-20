'use client';

import type { Ref } from 'react';
import { Check, CircleCheck, CircleX, TriangleAlert } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { BrandMark } from '@/landing/components/ui/brandMark';
import { cn } from '@/landing/lib/cn';
import { vars } from '@/landing/lib/cssVars';
import { formatUptime } from '@/utils/formatters';
import styles from './statusPageMock.module.css';

/** `dips` maps days ago to that day's uptime; under 95% draws red, under 99% amber, as the real page does. */
export type MockMonitor = { name: string; uptime: number; dips?: Record<number, number>; down?: boolean };

type StatusPageMockProps = {
  monitors: MockMonitor[];
  days: number;
  headline: string;
  updated?: string;
  outage?: boolean;
  theme?: 'light' | 'dark';
  accent?: string;
  brand?: boolean;
  axis?: boolean;
  overall?: number;
  incident?: { title: string; meta: string; impact: string };
  poweredBy?: boolean;
  pageRef?: Ref<HTMLDivElement>;
  className?: string;
};

export function StatusPageMock({
  monitors,
  days,
  headline,
  updated,
  outage = false,
  theme = 'dark',
  accent = '#2f63d6',
  brand = true,
  axis = false,
  overall,
  incident,
  poweredBy = false,
  pageRef,
  className,
}: StatusPageMockProps) {
  const t = useTranslations('landing.uptime.status.page');
  const locale = useLocale();
  return (
    <div className={cn(styles.window, className)} aria-hidden data-nosnippet>
      <div className={styles.chrome}>
        <i />
        <i />
        <i />
        <span>status.acme.com</span>
      </div>
      <div
        ref={pageRef}
        className={styles.page}
        data-theme={theme}
        data-brand={brand || undefined}
        style={vars({ '--sp-accent': accent })}
      >
        {brand && (
          <div className={styles.band}>
            <b className={styles.brand}>
              <i />
              Acme
            </b>
          </div>
        )}
        <div className={styles.card}>
          <div className={styles.hero} data-outage={outage || undefined}>
            <span className={styles.heroIcon}>
              {outage ? <TriangleAlert strokeWidth={2.6} /> : <Check strokeWidth={3} />}
            </span>
            <strong>{headline}</strong>
            {updated && <span className={styles.updated}>{updated}</span>}
          </div>
          <div className={styles.monitors}>
            {monitors.map(({ name, uptime, dips = {}, down }, row) => (
              <div key={name} className={styles.row} data-down={down || undefined}>
                <div className={styles.rowHead}>
                  <span className={styles.rowName}>
                    {down ? <CircleX /> : <CircleCheck />}
                    {name}
                  </span>
                  <span className={styles.rowMeta}>
                    <span className={styles.rowUptime}>
                      {t('uptime', { value: formatUptime(uptime * 100, locale) })}
                    </span>
                    <span className={styles.pill} data-tone={down ? 'down' : 'ok'}>
                      {down ? t('down') : t('operational')}
                    </span>
                  </span>
                </div>
                <div className={styles.bars}>
                  {Array.from({ length: days }, (_, i) => {
                    const dip = dips[days - 1 - i];
                    return <i key={i} data-dip={dip === undefined ? undefined : dip < 0.95 ? 'down' : 'warn'} />;
                  })}
                </div>
                {axis && row === monitors.length - 1 && (
                  <div className={styles.axis}>
                    <span>{t('ago', { days })}</span>
                    <span>{t('today')}</span>
                  </div>
                )}
              </div>
            ))}
            {overall !== undefined && (
              <p className={styles.overall}>
                {t.rich('overall', {
                  uptime: formatUptime(overall * 100, locale),
                  value: (chunks) => <b>{chunks}</b>,
                })}
              </p>
            )}
          </div>
        </div>
        {incident && (
          <>
            <p className={styles.pastLabel}>{t('past')}</p>
            <article className={styles.incident}>
              <span>
                <b>{incident.title}</b>
                <span>{incident.meta}</span>
              </span>
              <span className={styles.pill} data-tone='partial'>
                {incident.impact}
              </span>
            </article>
          </>
        )}
        {poweredBy && (
          <p className={styles.powered}>
            {t('poweredBy')}
            <b>
              <BrandMark className='size-3.5' />
              Betterlytics
            </b>
          </p>
        )}
      </div>
    </div>
  );
}
