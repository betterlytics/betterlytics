'use client';

import { useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Stage } from '@/landing/components/feature/showcase';
import { useInView } from '@/landing/hooks/useInView';
import { vars } from '@/landing/lib/cssVars';
import { rovingTabKeys } from '@/landing/lib/rovingTabs';
import { IncidentScene } from './incidentScene';
import styles from './incidentStory.module.css';

const STEPS = ['fail', 'confirm', 'alert', 'status', 'recover'] as const;

/** How long each step holds; the selected step's bar fills over it, and the next step comes when it's full. */
const DWELL_MS = 5000;

export function IncidentStory() {
  const t = useTranslations('landing.uptime.story');
  const ref = useRef<HTMLDivElement>(null);
  const onScreen = useInView(ref, 'onScreen');
  const entered = useInView(ref, 'read');
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  // bumped on every pick, so picking the step already shown still restarts its bar
  const [pick, setPick] = useState(0);

  const select = (index: number) => {
    setStep(index);
    setPick((n) => n + 1);
  };
  const advance = () => {
    if (!reduce) setStep((s) => (s + 1) % STEPS.length);
  };

  return (
    <div
      ref={ref}
      className={styles.story}
      data-held={!(entered && onScreen) || undefined}
      data-still={reduce || undefined}
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
            <span className={styles.stepBody}>{t(`steps.${key}.body`)}</span>
            <i
              key={i === step ? `${step}-${pick}` : i}
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
          <IncidentScene step={step} />
        </Stage>
      </div>
    </div>
  );
}
