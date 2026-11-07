'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { CoreWebVitalName } from '@/entities/analytics/webVitals.entities';
import { formatCWV } from '@/utils/coreWebVitals';
import levels from '@/landing/components/ui/vitalLevels.module.css';
import { cn } from '@/landing/lib/cn';
import { vars } from '@/landing/lib/cssVars';
import { AT, BODY, END, FRAMES, type Frame, MOMENTS, SHIFT, SPANS, STEP, levelOf, momentOf } from './timeline';
import styles from './filmstrip.module.css';

/**
 * Labels in the gap beside a frame. `y` is the element's middle, as a share of the frame's height. A shift brackets
 * `y` to `to` instead: everything the moved content covered, before and after, which is what CLS scores.
 */
const CALLOUTS: Partial<Record<number, { label: CoreWebVitalName | 'shift' | 'tap'; y: number; to?: number }>> = {
  [1500]: { label: 'FCP', y: 0.228 },
  [3000]: { label: 'LCP', y: 0.478 },
  [3500]: { label: 'shift', y: 0.304, to: 0.733 },
  [4000]: { label: 'tap', y: 0.908 },
  [4500]: { label: 'INP', y: 0.908 },
};

/** The metrics a frame shows: what it's marked with, the tap that starts INP, and the first byte, which arrives with nothing on screen. */
const owners = (frame: Frame): CoreWebVitalName[] => [
  ...(frame.moment ? [frame.moment.metric] : []),
  ...(frame.tap ? (['INP'] as const) : []),
  ...(AT.TTFB > frame.t - STEP && AT.TTFB <= frame.t ? (['TTFB'] as const) : []),
];

function Page({ t }: { t: number }) {
  return (
    <span
      className={styles.page}
      data-text={t >= AT.FCP || undefined}
      data-body={t >= BODY || undefined}
      data-image={t >= AT.LCP || undefined}
      data-shifted={t >= AT.CLS || undefined}
      data-responded={t >= AT.PAINT || undefined}
    >
      <span className={styles.banner}>
        <i />
        <i />
      </span>
      <span className={styles.content}>
        <span className={styles.nav}>
          <i />
          <span>
            <i />
            <i />
          </span>
        </span>
        <span className={styles.heading}>
          <i />
          <i />
        </span>
        <span className={styles.media}>
          <i className={styles.ghost} />
        </span>
        <span className={styles.lines}>
          <i />
          <i />
          <i />
        </span>
        <span className={styles.button}>
          <i />
          <svg viewBox='0 0 12 12'>
            <path d='M2.6 6.3l2.2 2.2 4.6-4.8' />
          </svg>
        </span>
      </span>
    </span>
  );
}

function Cards({
  picked,
  onPick,
}: {
  picked: CoreWebVitalName | null;
  onPick: (metric: CoreWebVitalName) => void;
}) {
  const t = useTranslations('landing.vitals.anatomy');
  return (
    <div className={styles.deck}>
      <ol className={styles.cards}>
        {MOMENTS.map(({ metric }) => {
          const on = picked === metric;
          return (
            <li key={metric} className={styles.card} data-active={on || undefined}>
              <div className={styles.copy}>
                <h3>
                  <button type='button' aria-pressed={on} onClick={() => onPick(metric)}>
                    {t(`metrics.${metric}.name`)}
                  </button>
                </h3>
                <p>{t(`metrics.${metric}.body`)}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** The load from 0.5s, one frame every half second; picking a metric finds the frame where it's taken. */
export function LoadFilmstrip() {
  const t = useTranslations('landing.vitals.anatomy');
  const locale = useLocale();
  const [picked, setPicked] = useState<CoreWebVitalName | null>(null);
  const pick = (metric: CoreWebVitalName) => setPicked((current) => (current === metric ? null : metric));
  const spoken = (unit: 'second' | 'millisecond', amount: number) =>
    new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'long' }).format(amount);
  const at = (ms: number) => spoken('second', ms / 1000);

  return (
    <div className={cn(levels.levels, styles.film)}>
      <div className={styles.stage}>
        <p className='sr-only'>
          {t('alt', {
            end: at(END),
            ttfb: at(AT.TTFB),
            fcp: at(AT.FCP),
            lcp: at(AT.LCP),
            cls: at(AT.CLS),
            shift: SHIFT,
            inp: at(AT.INP),
            response: spoken('millisecond', AT.PAINT - AT.INP),
          })}
        </p>

        <div className={styles.strip}>
          <div className={styles.reel} data-picked={picked ?? undefined}>
            <ol className={styles.frames} aria-hidden>
              {FRAMES.slice(1).map((frame) => {
                const shows = owners(frame);
                const callout = CALLOUTS[frame.t];
                const level = frame.moment ? levelOf(frame.moment) : undefined;
                return (
                  <li
                    key={frame.t}
                    className={styles.frame}
                    data-current={(picked !== null && shows.includes(picked)) || undefined}
                    data-changed={frame.changed || undefined}
                    data-tap={frame.tap || undefined}
                    data-for={frame.moment?.metric}
                    data-owned={shows.length > 0 || undefined}
                    onClick={shows.length > 0 ? () => pick(shows[0]) : undefined}
                  >
                    <span className={styles.shot} data-level={level}>
                      <Page t={frame.t} />
                    </span>
                    {callout && (
                      <span
                        className={styles.callout}
                        data-level={level}
                        data-span={callout.to !== undefined || undefined}
                        style={vars({ '--y': callout.y, '--to': callout.to ?? callout.y })}
                      >
                        <i />
                        <b>
                          {callout.label === 'shift' || callout.label === 'tap'
                            ? t(`callouts.${callout.label}`)
                            : callout.label}
                        </b>
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>

            <div className={styles.lane} aria-hidden>
              {FRAMES.map((frame) => (
                <i key={frame.t} className={styles.tick} style={vars({ '--f': frame.t / END })} />
              ))}
              {SPANS.map((span) => (
                <i
                  key={span.metric}
                  className={styles.span}
                  data-level={levelOf(momentOf(span.metric))}
                  data-spot={picked === span.metric || undefined}
                  data-from-start={span.from === 0 || undefined}
                  style={vars({ '--f': span.from / END, '--len': (span.to - span.from) / END })}
                />
              ))}
              {MOMENTS.map((moment) => (
                <span
                  key={moment.metric}
                  className={styles.mark}
                  data-level={levelOf(moment)}
                  data-spot={picked === moment.metric || undefined}
                  data-metric={moment.metric}
                  style={vars({ '--f': moment.at / END })}
                >
                  <span>
                    <b>{moment.metric}</b> {formatCWV(moment.metric, moment.value, locale)}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Cards picked={picked} onPick={pick} />
    </div>
  );
}
