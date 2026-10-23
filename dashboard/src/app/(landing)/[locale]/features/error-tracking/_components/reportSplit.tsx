import { Hash, Image as ImageIcon, Inbox, Mail, type LucideIcon } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { AppleMark, WARN_ICON } from '@/landing/components/illustrations/errors';
import { FLAGS } from '@/landing/components/illustrations/flags';
import { CountUp } from '@/landing/components/ui/countUp';
import { InView } from '@/landing/components/ui/inView';
import { PLAN_ERROR } from '@/landing/content/planError';
import { vars } from '@/landing/lib/cssVars';
import styles from './reportSplit.module.css';

type Key =
  'upgrade' | 'pricing' | 'dead' | 'screenshot' | 'phone' | 'sticky' | 'again' | 'ticket' | 'chrome' | 'inbox';

/** `lane` picks the row, `dur` the seconds to cross, `at` how far across it starts (0–1); `rest` overrides the still position (in %) where neighbours would overlap. */
type Flyer = {
  key: Key;
  lane: number;
  dur: number;
  at: number;
  r: number;
  rest?: number;
  icon?: LucideIcon;
  kind?: 'sticky' | 'ticket' | 'stack' | 'inbox';
};

const LANES = [32, 45, 58, 71, 84];
const BACK_LANES = [1, 3];

const FLYERS: Flyer[] = [
  { key: 'upgrade', lane: 0, dur: 30, at: 0.08, r: -2, icon: Mail, kind: 'stack' },
  { key: 'pricing', lane: 0, dur: 30, at: 0.6, r: 1.5, icon: Hash },
  { key: 'dead', lane: 1, dur: 40, at: 0.3, r: 1, icon: Mail },
  { key: 'screenshot', lane: 1, dur: 40, at: 0.85, r: -3, icon: ImageIcon },
  { key: 'phone', lane: 2, dur: 26, at: 0.2, r: 2, icon: Hash },
  { key: 'sticky', lane: 2, dur: 26, at: 0.72, r: -3, rest: 56, kind: 'sticky' },
  { key: 'again', lane: 3, dur: 44, at: 0.05, r: -1.5, icon: Mail },
  { key: 'chrome', lane: 3, dur: 44, at: 0.55, r: 2, icon: Hash },
  { key: 'inbox', lane: 4, dur: 33, at: 0.4, r: 1.5, rest: 8, icon: Inbox, kind: 'inbox' },
  { key: 'ticket', lane: 4, dur: 33, at: 0.9, r: -2.5, rest: 56, kind: 'ticket' },
];

export function ReportSplit() {
  const t = useTranslations('landing.errors.report');
  const locale = useLocale();
  const region = new Intl.DisplayNames([locale], { type: 'region' }).of('DK');
  return (
    <InView className={styles.split}>
      <p className='sr-only'>{t('alt')}</p>
      <div className={styles.guess}>
        <p className={styles.heading}>{t('guess')}</p>
        <div className={styles.lanes} aria-hidden>
          {FLYERS.map(({ key, lane, dur, at, r, rest, icon: Icon, kind }) => (
            <span
              key={key}
              className={styles.flyer}
              data-kind={kind}
              data-back={BACK_LANES.includes(lane) || undefined}
              style={vars({
                '--x': `${rest ?? 4 + at * 58}%`,
                '--y': `${LANES[lane]}%`,
                '--r': `${r}deg`,
                '--dur': `${dur}s`,
                '--delay': `${-at * dur}s`,
              })}
            >
              {kind === 'stack' && (
                <>
                  <span className={styles.copy} data-depth={2}>
                    {Icon && <Icon className='size-3.5' />}
                    {t(`notes.${key}`)}
                  </span>
                  <span className={styles.copy} data-depth={1}>
                    {Icon && <Icon className='size-3.5' />}
                    {t(`notes.${key}`)}
                  </span>
                </>
              )}
              {kind === 'ticket' ? <b className={styles.p1}>P1</b> : Icon && <Icon className='size-3.5' />}
              {kind === 'inbox' && <i className={styles.dot} />}
              {t(`notes.${key}`)}
              {kind === 'inbox' && <small>{t('notes.unread', { count: 14 })}</small>}
            </span>
          ))}
        </div>
      </div>
      <div className={styles.fix}>
        <p className={styles.heading}>{t('fix')}</p>
        <div className={styles.issue} aria-hidden>
          <div className={styles.issueHead}>
            <span className={styles.icon}>{WARN_ICON}</span>
            <span className='min-w-0'>
              <b className={styles.type}>{PLAN_ERROR.type}</b>
              <span className={styles.message}>{PLAN_ERROR.message}</span>
            </span>
          </div>
          {PLAN_ERROR.frames.slice(0, 2).map((frame) => (
            <div key={frame.fn} className={styles.frame}>
              <span className={styles.line}>{frame.line}</span>
              <span className={styles.call}>
                at <b>{frame.fn}</b> ({frame.file}:{frame.col})
              </span>
              <span className={styles.inApp}>{t('inApp')}</span>
            </div>
          ))}
          <div className={styles.meta}>
            <span className={styles.who}>
              <Image src='/browser-icons/chrome.svg' alt='' width={14} height={14} />
              <AppleMark className='size-[13px]' />
              <FLAGS.DK className='h-[10px] w-[15px] rounded-[1.5px] ring-1 ring-white/8' title={region} />
            </span>
            <span className={styles.page}>/pricing</span>
            <span className={styles.count}>
              <CountUp value={1206} className='font-medium text-fg' /> {t('occurrences')}
            </span>
          </div>
        </div>
      </div>
    </InView>
  );
}
