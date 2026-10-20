'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Stage } from '@/landing/components/feature/stage';
import { useInView } from '@/landing/hooks/useInView';
import { vars } from '@/landing/lib/cssVars';
import { rovingTabKeys } from '@/landing/lib/rovingTabs';
import styles from './incidentStory.module.css';
import { StoryScenes } from './storyScenes';

const STEPS = ['fail', 'confirm', 'alert', 'status', 'recover'] as const;

const DWELL_MS = 5000;

export function IncidentStory() {
  const t = useTranslations('landing.uptime.story');
  const ref = useRef<HTMLDivElement>(null);
  const onScreen = useInView(ref, 'onScreen');
  const entered = useInView(ref, 'read');
  const reduce = useReducedMotion();
  // state, so the server markup and first client render agree
  const [still, setStill] = useState(false);
  useEffect(() => setStill(reduce === true), [reduce]);
  const [step, setStep] = useState(0);
  const [auto, setAuto] = useState(true);

  const select = (index: number) => {
    setStep(index);
    setAuto(false);
  };
  const advance = () => {
    if (auto && !still) setStep((s) => (s + 1) % STEPS.length);
  };

  return (
    <div
      ref={ref}
      className={styles.story}
      data-held={!(entered && onScreen) || undefined}
      data-still={still || !auto || undefined}
    >
      <div
        role='tablist'
        aria-orientation='vertical'
        aria-label={t('stepsLabel')}
        className={styles.steps}
        onKeyDown={rovingTabKeys(step, STEPS.length, select, 'vertical')}
      >
        {STEPS.map((key, i) => (
          <button
            key={key}
            type='button'
            role='tab'
            id={`story-tab-${key}`}
            aria-selected={i === step}
            aria-controls='story-stage'
            tabIndex={i === step ? 0 : -1}
            className={styles.step}
            style={vars({ '--dwell': `${DWELL_MS}ms` })}
            onClick={() => select(i)}
          >
            <time className={styles.time}>{t(`steps.${key}.time`)}</time>
            <span className={styles.stepTitle}>{t(`steps.${key}.title`)}</span>
            <span className={styles.stepBody} aria-hidden>
              {t(`steps.${key}.body`)}
            </span>
            <i
              key={i === step ? `${step}-${auto}` : i}
              className={styles.progress}
              aria-hidden
              onAnimationEnd={i === step ? advance : undefined}
            />
          </button>
        ))}
      </div>
      <div id='story-stage' role='tabpanel' aria-labelledby={`story-tab-${STEPS[step]}`} className={styles.panel}>
        <p className={styles.caption}>{t(`steps.${STEPS[step]}.body`)}</p>
        <Stage className={styles.stage}>
          <i className={styles.drift} />
          <StoryScenes step={step} />
        </Stage>
      </div>
    </div>
  );
}
