'use client';

import { useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Stage } from '@/landing/components/feature/stage';
import { useInView } from '@/landing/hooks/useInView';
import { vars } from '@/landing/lib/cssVars';
import { rovingTabKeys } from '@/landing/lib/rovingTabs';
import { ReplayScenes } from './replayScenes';
import styles from './replayStory.module.css';

const STEPS = ['record', 'error', 'ready', 'jump', 'why'] as const;

const DWELL_MS = 5600;

/** The steps are a replay scrubber: played chapters stay filled, and the active one's fill is the timer. */
export function ReplayStory() {
  const t = useTranslations('landing.replay.story');
  const ref = useRef<HTMLDivElement>(null);
  const onScreen = useInView(ref, 'onScreen');
  const entered = useInView(ref, 'read');
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  // bumped on every pick, so picking the step already shown still restarts its fill
  const [pick, setPick] = useState(0);

  const select = (index: number) => {
    setStep(index);
    setPick((n) => n + 1);
  };
  const advance = () => {
    if (!reduce) setStep((s) => (s + 1) % STEPS.length);
  };
  const active = STEPS[step];

  return (
    <div
      ref={ref}
      className={styles.story}
      data-held={!(entered && onScreen) || undefined}
      data-still={reduce || undefined}
    >
      <div
        role='tablist'
        aria-label={t('stepsLabel')}
        className={styles.steps}
        onKeyDown={rovingTabKeys(step, STEPS.length, select)}
      >
        {STEPS.map((key, i) => (
          <button
            key={key}
            type='button'
            role='tab'
            id={`replay-story-tab-${key}`}
            aria-selected={i === step}
            aria-controls='replay-story-stage'
            tabIndex={i === step ? 0 : -1}
            className={styles.step}
            data-played={i < step || undefined}
            style={vars({ '--dwell': `${DWELL_MS}ms` })}
            onClick={() => select(i)}
          >
            <i className={styles.track} aria-hidden>
              <i
                key={i === step ? `${step}-${pick}` : i}
                className={styles.fill}
                onAnimationEnd={i === step ? advance : undefined}
              />
            </i>
            <time className={styles.time}>{t(`steps.${key}.time`)}</time>
            <span className={styles.stepTitle}>{t(`steps.${key}.title`)}</span>
            <span className={styles.stepBody} aria-hidden>
              {t(`steps.${key}.body`)}
            </span>
          </button>
        ))}
      </div>
      <div
        id='replay-story-stage'
        role='tabpanel'
        aria-labelledby={`replay-story-tab-${active}`}
        className={styles.panel}
      >
        <p className={styles.caption}>
          <b>{t(`steps.${active}.title`)}</b> {t(`steps.${active}.body`)}
        </p>
        <Stage className={styles.stage}>
          <ReplayScenes step={step} />
        </Stage>
      </div>
    </div>
  );
}
