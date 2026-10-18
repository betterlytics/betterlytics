'use client';

import { CircleCheck, CircleX, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import styles from './outageStatusPage.module.css';

/* Mock data, deliberately untranslated: the public monitors, with the day (counted from the oldest) that
   dipped below 99%. */
const PUBLIC: { name: string; dip?: number; down?: boolean }[] = [
  { name: 'API', dip: 14 },
  { name: 'Checkout', down: true },
  { name: 'Website' },
];
const DAYS = 36;

/** The public status page mid-outage, after app/status/[slug]: the banner has switched on its own, and the
    outage waits as a suggested incident for someone to write up. */
export function OutageStatusPage() {
  const text = useTranslations('landing.illustrations.uptime');
  const t = useTranslations('landing.uptime.story.stage');
  return (
    <div className={styles.status}>
      <div className={styles.chrome}>
        <i />
        <i />
        <i />
        <span>status.acme.com</span>
      </div>
      <div className={styles.viewport}>
        <div className={styles.band}>
          <b className={styles.brand}>
            <i />
            Acme
          </b>
        </div>
        <div className={styles.statusCard}>
          <div className={styles.hero}>
            <span className={styles.heroIcon}>
              <TriangleAlert strokeWidth={2.6} />
            </span>
            <strong>{text('someDown')}</strong>
          </div>
          <div className={styles.statusRows}>
            {PUBLIC.map(({ name, dip, down }) => (
              <div key={name} className={styles.statusRow} data-down={down || undefined}>
                {down ? <CircleX /> : <CircleCheck />}
                <b>{name}</b>
                <span className={styles.badge}>{down ? text('down') : text('operational')}</span>
                <span className={styles.history}>
                  {Array.from({ length: DAYS }, (_, i) => (
                    <i key={i} data-dip={i === dip || undefined} />
                  ))}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.suggestion}>
          <span>
            <b>{t('suggested')}</b>
            {t('suggestedBody')}
          </span>
          <span className={styles.write}>{t('write')}</span>
        </div>
      </div>
    </div>
  );
}
