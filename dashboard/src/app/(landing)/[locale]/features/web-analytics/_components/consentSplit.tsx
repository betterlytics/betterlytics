import { Check, Cookie, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { InView } from '@/landing/components/ui/inView';
import { vars } from '@/landing/lib/cssVars';
import styles from './consentSplit.module.css';

type Kind = 'bar' | 'modal' | 'card' | 'wall' | 'partners' | 'corner';
type Button = 'reject' | 'accept' | 'save' | 'customize' | 'continue' | 'manage' | 'agree' | 'ok';
type Translate = ReturnType<typeof useTranslations<'landing.analytics.privacy'>>;

const LANES = [33, 56, 80];
const BACK_LANE = 1;

/** The common shapes of a consent banner, each drawn generic so none reads as a real vendor's. */
const BANNERS: {
  kind: Kind;
  tone: 'light' | 'dark';
  buttons: Button[];
  lane: number;
  dur: number;
  at: number;
  rest: number;
}[] = [
  { kind: 'bar', tone: 'dark', buttons: ['reject', 'accept'], lane: 0, dur: 46, at: 0.04, rest: 3 },
  { kind: 'card', tone: 'light', buttons: ['customize', 'accept'], lane: 0, dur: 46, at: 0.58, rest: 60 },
  { kind: 'partners', tone: 'light', buttons: ['manage', 'agree'], lane: 1, dur: 58, at: 0.26, rest: 8 },
  { kind: 'corner', tone: 'dark', buttons: ['ok'], lane: 1, dur: 58, at: 0.8, rest: 62 },
  { kind: 'modal', tone: 'light', buttons: ['save', 'accept'], lane: 2, dur: 40, at: 0.4, rest: 5 },
  { kind: 'wall', tone: 'dark', buttons: ['continue'], lane: 2, dur: 40, at: 0.92, rest: 56 },
];

function Body({ kind, t }: { kind: Kind; t: Translate }) {
  switch (kind) {
    case 'bar':
    case 'partners':
    case 'corner':
      return <p className={styles.text}>{t(`banners.${kind}.body`)}</p>;
    case 'card':
      return (
        <>
          <p className={styles.title}>
            <Cookie className={styles.cookie} strokeWidth={1.75} />
            {t('banners.card.title')}
          </p>
          <p className={styles.text}>{t('banners.card.body')}</p>
        </>
      );
    case 'wall':
      return (
        <>
          <p className={styles.title}>{t('banners.wall.title')}</p>
          <p className={styles.text}>{t('banners.wall.body')}</p>
        </>
      );
    case 'modal':
      return (
        <>
          <p className={styles.title}>{t('banners.modal.title')}</p>
          <ul className={styles.rows}>
            <li>
              {t('banners.modal.necessary')}
              <span className={styles.always}>{t('banners.modal.always')}</span>
            </li>
            <li>
              {t('banners.modal.analytics')}
              <i className={styles.toggle} data-on />
            </li>
            <li>
              {t('banners.modal.marketing')}
              <i className={styles.toggle} />
            </li>
          </ul>
        </>
      );
  }
}

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
          {BANNERS.map(({ kind, tone, buttons, lane, dur, at, rest }, i) => (
            <div
              key={kind}
              className={styles.notice}
              data-kind={kind}
              data-tone={tone}
              data-back={lane === BACK_LANE || undefined}
              data-spare={i % 2 === 1 || undefined}
              style={vars({
                '--x': `${rest}%`,
                '--y': `${LANES[lane]}%`,
                '--dur': `${dur}s`,
                '--delay': `${-at * dur}s`,
              })}
            >
              {(kind === 'card' || kind === 'modal') && <X className={styles.close} strokeWidth={2} />}
              <div className={styles.copy}>
                <Body kind={kind} t={t} />
              </div>
              <div className={styles.actions}>
                {buttons.map((button, b) => (
                  <span
                    key={button}
                    className={styles.button}
                    data-primary={b === buttons.length - 1 || undefined}
                  >
                    {t(`buttons.${button}`)}
                  </span>
                ))}
              </div>
            </div>
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
            <span className={styles.pageTitle} />
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
