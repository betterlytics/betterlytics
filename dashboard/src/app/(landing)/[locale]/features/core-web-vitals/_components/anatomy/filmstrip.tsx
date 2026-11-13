'use client';

import { type Dispatch, useCallback, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import type { CoreWebVitalName } from '@/entities/analytics/webVitals.entities';
import { formatCWV } from '@/utils/coreWebVitals';
import levels from '@/landing/components/ui/vitalLevels.module.css';
import { useDismiss } from '@/landing/hooks/useDismiss';
import { useInView } from '@/landing/hooks/useInView';
import { cn } from '@/landing/lib/cn';
import { vars } from '@/landing/lib/cssVars';
import {
  AT,
  BODY,
  END,
  FRAMES,
  type Frame,
  MOMENTS,
  type Moment,
  SHIFT,
  SPANS,
  STEP,
  levelOf,
  momentOf,
} from './timeline';
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
/** The order the labels draw in: the order the load reaches them. */
const DRAW_ORDER = Object.keys(CALLOUTS).map(Number);

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

/** A metric's dot on the axis, with its name and value under it. */
function Mark({ moment, spot }: { moment: Moment; spot: boolean }) {
  const locale = useLocale();
  return (
    <span
      className={styles.mark}
      data-level={levelOf(moment)}
      data-spot={spot || undefined}
      data-metric={moment.metric}
      style={vars({ '--f': moment.at / END })}
    >
      <span>
        <b>{moment.metric}</b> {formatCWV(moment.metric, moment.value, locale)}
      </span>
    </span>
  );
}

/** A wait a metric times, as a bar from its start to when its number is known. */
function Span({ span, spot }: { span: (typeof SPANS)[number]; spot: boolean }) {
  return (
    <i
      className={styles.span}
      data-level={levelOf(momentOf(span.metric))}
      data-spot={spot || undefined}
      data-from-start={span.from === 0 || undefined}
      style={vars({
        '--f': span.from / END,
        '--len': (span.to - span.from) / END,
        '--steps': (span.to - span.from) / STEP,
      })}
    />
  );
}

function Cards({ picked, onPick }: { picked: CoreWebVitalName | null; onPick: Dispatch<CoreWebVitalName> }) {
  const t = useTranslations('landing.vitals.anatomy');
  return (
    <div className={styles.deck}>
      <ol className={styles.cards}>
        {MOMENTS.map(({ metric }) => {
          const on = picked === metric;
          return (
            <li
              key={metric}
              className={styles.card}
              data-active={on || undefined}
              data-pick={metric}
              onClick={(event) => {
                if ((event.target as Element).closest('button') || window.getSelection()?.toString()) return;
                onPick(metric);
              }}
            >
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
  const clear = useCallback(() => setPicked(null), []);
  useDismiss(picked !== null, '[data-pick]', clear);
  const reel = useRef<HTMLDivElement>(null);
  const seen = useInView(reel, 'draw');
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
            shift: new Intl.NumberFormat(locale).format(SHIFT),
            inp: at(AT.INP),
            response: spoken('millisecond', AT.PAINT - AT.INP),
          })}
        </p>

        <div className={styles.strip}>
          <div ref={reel} className={styles.reel} data-picked={picked ?? undefined} data-in={seen || undefined}>
            <ol className={styles.frames} aria-hidden>
              {FRAMES.slice(1).map((frame) => {
                const shows = owners(frame);
                const callout = CALLOUTS[frame.t];
                const level = frame.moment ? levelOf(frame.moment) : undefined;
                const mark = MOMENTS.find((moment) => moment.at === frame.t);
                const span = mark && SPANS.find((wait) => wait.metric === mark.metric);
                return (
                  <li
                    key={frame.t}
                    className={styles.frame}
                    data-current={(picked !== null && shows.includes(picked)) || undefined}
                    data-changed={frame.changed || undefined}
                    data-tap={frame.tap || undefined}
                    data-for={frame.moment?.metric}
                    data-pick={shows[0]}
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
                        style={vars({
                          '--y': callout.y,
                          '--to': callout.to ?? callout.y,
                          '--k': DRAW_ORDER.indexOf(frame.t),
                        })}
                      >
                        <i />
                        <b>
                          {callout.label === 'shift' || callout.label === 'tap'
                            ? t(`callouts.${callout.label}`)
                            : callout.label}
                        </b>
                      </span>
                    )}
                    <span className={styles.stamp}>
                      {span && <Span span={span} spot={picked === span.metric} />}
                      {mark && <Mark moment={mark} spot={picked === mark.metric} />}
                    </span>
                  </li>
                );
              })}
            </ol>

            <div className={styles.lane} aria-hidden>
              {FRAMES.map((frame) => (
                <i key={frame.t} className={styles.tick} style={vars({ '--f': frame.t / END })} />
              ))}
              {SPANS.map((span) => (
                <Span key={span.metric} span={span} spot={picked === span.metric} />
              ))}
              {MOMENTS.map((moment) => (
                <Mark key={moment.metric} moment={moment} spot={picked === moment.metric} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <Cards picked={picked} onPick={pick} />
    </div>
  );
}
