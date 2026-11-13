import { Check, Cookie } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { InView } from '@/landing/components/ui/inView';
import { vars } from '@/landing/lib/cssVars';
import styles from './consentSplit.module.css';

type Notice = 'cookies' | 'choices' | 'allow' | 'improve' | 'settings' | 'value' | 'partners' | 'necessary';
type Button = 'accept' | 'reject' | 'manage' | 'ok' | 'save';

const LANES = [33, 46, 59, 72, 85];
const BACK_LANES = [1, 3];

/** `lane` picks the row, `dur` the seconds to cross, `at` how far across it starts (0–1), `rest` where it stands still (in %). */
const NOTICES: { key: Notice; lane: number; dur: number; at: number; rest: number; buttons: Button[] }[] = [
  { key: 'cookies', lane: 0, dur: 32, at: 0.1, rest: 6, buttons: ['accept', 'reject'] },
  { key: 'choices', lane: 0, dur: 32, at: 0.62, rest: 56, buttons: ['manage'] },
  { key: 'partners', lane: 1, dur: 42, at: 0.32, rest: 4, buttons: ['ok'] },
  { key: 'necessary', lane: 1, dur: 42, at: 0.84, rest: 50, buttons: ['save'] },
  { key: 'allow', lane: 2, dur: 27, at: 0.44, rest: 12, buttons: ['accept', 'reject'] },
  { key: 'settings', lane: 2, dur: 27, at: 0.94, rest: 60, buttons: [] },
  { key: 'improve', lane: 3, dur: 46, at: 0.18, rest: 22, buttons: ['ok'] },
  { key: 'value', lane: 4, dur: 35, at: 0.7, rest: 6, buttons: ['accept', 'manage'] },
];

const FACTS = ['cookies', 'ip', 'eu'] as const;

export function ConsentSplit() {
  const t = useTranslations('landing.analytics.privacy');
  return (
    <InView className={styles.split}>
      <p className='sr-only' data-nosnippet>
        {t('alt')}
      </p>
      <div className={styles.banner}>
        <p className={styles.heading}>{t('banner')}</p>
        <div className={styles.lanes} aria-hidden data-nosnippet>
          {NOTICES.map(({ key, lane, dur, at, rest, buttons }, i) => (
            <span
              key={key}
              className={styles.notice}
              data-back={BACK_LANES.includes(lane) || undefined}
              data-spare={i % 2 === 1 || undefined}
              style={vars({
                '--x': `${rest}%`,
                '--y': `${LANES[lane]}%`,
                '--dur': `${dur}s`,
                '--delay': `${-at * dur}s`,
              })}
            >
              <Cookie className={styles.cookie} strokeWidth={1.75} />
              {t(`notices.${key}`)}
              {buttons.map((button, b) => (
                <span key={button} className={styles.button} data-primary={b === 0 || undefined}>
                  {t(`buttons.${button}`)}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
      <div className={styles.clean}>
        <p className={styles.heading}>{t('clean')}</p>
        <div className={styles.window} aria-hidden data-nosnippet>
          <div className={styles.bar}>
            <i />
            <i />
            <i />
            <span className={styles.url}>acme.com/pricing</span>
          </div>
          <div className={styles.page}>
            <span className={styles.brand} />
            <span className={styles.title} />
            <span className={styles.line} />
            <span className={styles.line} data-short />
            <div className={styles.plans}>
              {[false, true, false].map((lit, i) => (
                <span key={i} className={styles.plan} data-lit={lit || undefined}>
                  <i />
                  <i />
                  <i />
                </span>
              ))}
            </div>
          </div>
        </div>
        <ul className={styles.facts}>
          {FACTS.map((key) => (
            <li key={key}>
              <Check className='size-3.5' strokeWidth={2.25} aria-hidden />
              {t(`facts.${key}`)}
            </li>
          ))}
        </ul>
      </div>
    </InView>
  );
}
