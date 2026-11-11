import { Monitor, Smartphone, Tablet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { InView } from '@/landing/components/ui/inView';
import levels from '@/landing/components/ui/vitalLevels.module.css';
import { cn } from '@/landing/lib/cn';
import { vars } from '@/landing/lib/cssVars';
import { MeasuredGauges } from './measuredGauges';
import styles from './blindSpot.module.css';

const SOURCE_URL =
  'https://business.google.com/ca-en/think/marketing-strategies/mobile-page-speed-new-industry-benchmarks/';

const DEVICES = { phone: Smartphone, tablet: Tablet, desktop: Monitor };

type Key = 'loading' | 'pay' | 'jumped' | 'blank' | 'menu' | 'photos' | 'typing' | 'moving' | 'elsewhere' | 'come';

const LANES = [32, 45, 58, 71, 84];
const BACK_LANES = [1, 3];

/** `lane` picks the row, `dur` the seconds to cross, `at` how far across it starts (0–1), `rest` where it stands still (in %). */
const THOUGHTS: { key: Key; device: keyof typeof DEVICES; lane: number; dur: number; at: number; rest: number }[] =
  [
    { key: 'loading', device: 'phone', lane: 0, dur: 30, at: 0.08, rest: 8 },
    { key: 'menu', device: 'tablet', lane: 0, dur: 30, at: 0.58, rest: 50 },
    { key: 'photos', device: 'desktop', lane: 1, dur: 40, at: 0.3, rest: 4 },
    { key: 'typing', device: 'desktop', lane: 1, dur: 40, at: 0.8, rest: 46 },
    { key: 'pay', device: 'phone', lane: 2, dur: 26, at: 0.45, rest: 10 },
    { key: 'elsewhere', device: 'phone', lane: 2, dur: 26, at: 0.95, rest: 56 },
    { key: 'blank', device: 'phone', lane: 3, dur: 44, at: 0.15, rest: 26 },
    { key: 'come', device: 'phone', lane: 3, dur: 44, at: 0.65, rest: 66 },
    { key: 'jumped', device: 'phone', lane: 4, dur: 33, at: 0.7, rest: 4 },
    { key: 'moving', device: 'desktop', lane: 4, dur: 33, at: 0.2, rest: 54 },
  ];

export function BlindSpot() {
  const t = useTranslations('landing.vitals.blindSpot');
  return (
    <InView className={cn(levels.levels, styles.split)}>
      <p className='sr-only' data-nosnippet>
        {t('alt')}
      </p>
      <div className={styles.feel}>
        <p className={styles.heading}>{t('feel')}</p>
        <div className={styles.lanes} aria-hidden data-nosnippet>
          {THOUGHTS.map(({ key, device, lane, dur, at, rest }, i) => {
            const Device = DEVICES[device];
            return (
              <span
                key={key}
                className={styles.thought}
                data-back={BACK_LANES.includes(lane) || undefined}
                data-spare={i % 2 === 1 || undefined}
                style={vars({
                  '--x': `${rest}%`,
                  '--y': `${LANES[lane]}%`,
                  '--dur': `${dur}s`,
                  '--delay': `${-at * dur}s`,
                })}
              >
                <Device className={styles.device} />
                {t(`thoughts.${key}`)}
              </span>
            );
          })}
        </div>
      </div>
      <div className={styles.measure}>
        <p className={styles.heading}>{t('measure')}</p>
        <MeasuredGauges />
      </div>
      <p className={styles.source}>
        {t.rich('source', {
          link: (chunks) => (
            <a href={SOURCE_URL} target='_blank' rel='noopener noreferrer'>
              {chunks}
            </a>
          ),
        })}
      </p>
    </InView>
  );
}
