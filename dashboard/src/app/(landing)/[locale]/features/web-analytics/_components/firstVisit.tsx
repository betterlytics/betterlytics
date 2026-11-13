import { useTranslations } from 'next-intl';
import { SnippetPanel } from '@/landing/components/sections/snippetPanel';
import { buttonStyles } from '@/landing/components/ui/button';
import { InView } from '@/landing/components/ui/inView';
import { TrackedAnchor } from '@/landing/components/ui/trackedLink';
import { LINKS } from '@/landing/lib/links';
import { vars } from '@/landing/lib/cssVars';
import styles from './firstVisit.module.css';

const MINUTES = 30;

export function FirstVisit() {
  const t = useTranslations('landing.analytics.setup');
  return (
    <div className={styles.split}>
      <div className={styles.code}>
        <SnippetPanel label={t('snippetLabel')} />
      </div>
      <InView className={styles.live}>
        <p className={styles.state}>
          <i className={styles.pulse} aria-hidden />
          {t('live')}
        </p>
        <p className={styles.now}>
          <span className={styles.digits} aria-hidden>
            <span>0</span>
            <span>1</span>
          </span>
          <span className='sr-only'>1</span>
          <span className={styles.unit}>{t('online')}</span>
        </p>
        <div className={styles.strip} aria-hidden>
          {Array.from({ length: MINUTES }, (_, i) => (
            <i key={i} data-last={i === MINUTES - 1 || undefined} style={vars({ '--i': i })} />
          ))}
        </div>
        <p className={styles.axis} aria-hidden>
          <span>{t('ago', { minutes: MINUTES })}</span>
          <span>{t('nowLabel')}</span>
        </p>
        <TrackedAnchor
          className={buttonStyles({ variant: 'onVolt', size: 'sm', className: styles.guide })}
          href={LINKS.docs}
          placement='setup'
          destination='docs'
        >
          {t('cta')}
        </TrackedAnchor>
      </InView>
    </div>
  );
}
