'use client';

import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { PERFORMANCE_SCORE_THRESHOLDS, PERFORMANCE_SCORE_WEIGHTS } from '@/constants/coreWebVitals';
import type { CoreWebVitalName } from '@/entities/analytics/webVitals.entities';
import { getPerformanceGrade } from '@/utils/coreWebVitals';
import { InView } from '@/landing/components/ui/inView';
import { Heading } from '@/landing/components/ui/text';
import { TrackedAnchor } from '@/landing/components/ui/trackedLink';
import { vars } from '@/landing/lib/cssVars';
import { LINKS } from '@/landing/lib/links';
import { ScoreBadge } from './scoreBadge';
import { BREAKDOWN, scoreRow } from './vitalsData';
import styles from './priorityChart.module.css';

/* The plot shows share 0–32% across and score 40–100 up; every page sits inside that window. */
const MAX_SHARE = 0.32;
const MIN_SCORE = 40;
const ISO = [2, 4, 6];
/** Labels that would collide with a neighbour's sit on the dot's left. */
const LABEL_LEFT = new Set(['/about', '/']);
const RECIPE: CoreWebVitalName[] = ['LCP', 'INP', 'CLS', 'FCP', 'TTFB'];
const HEAVIEST = Math.max(...RECIPE.map((metric) => PERFORMANCE_SCORE_WEIGHTS[metric]));

const PAGES = BREAKDOWN.pages
  .map((row) => ({ ...row, ...scoreRow(row, 'p75') }))
  .sort((a, b) => b.opportunity - a.opportunity);

const x = (share: number) => (share / MAX_SHARE) * 100;
const y = (score: number) => ((100 - score) / (100 - MIN_SCORE)) * 100;

/** The area where opportunity reaches `level`: right of x = level / (100 - MIN_SCORE), under the curve score = 100 - level / share. */
function isoPath(level: number) {
  const start = level / (100 - MIN_SCORE);
  const points = Array.from({ length: 33 }, (_, i) => {
    const share = start + ((MAX_SHARE - start) * i) / 32;
    return `${x(share).toFixed(2)},${y(100 - level / share).toFixed(2)}`;
  });
  return { area: `M${points.join('L')}L100,100Z`, line: `M${points.join('L')}` };
}

export function PriorityChart() {
  const t = useTranslations('landing.vitals.priority');
  const tBadges = useTranslations('landing.vitals.breakdown.badges');
  const locale = useLocale();
  const [hot, setHot] = useState<string | null>(null);
  const percent = new Intl.NumberFormat(locale, { style: 'percent' });
  const decimal = (digits: number) =>
    new Intl.NumberFormat(locale, { minimumFractionDigits: digits, maximumFractionDigits: digits });
  const top = PAGES.slice(0, 3);

  return (
    <InView className={styles.priority}>
      <div className={styles.stage}>
        <div className={styles.plotWrap} aria-hidden>
          <span className={styles.axisY}>{t('axisY')}</span>
          <div className={styles.plot}>
            <svg className={styles.heat} viewBox='0 0 100 100' preserveAspectRatio='none'>
              {ISO.map((level) => {
                const { area, line } = isoPath(level);
                return (
                  <g key={level}>
                    <path d={area} className={styles.area} />
                    <path d={line} className={styles.iso} vectorEffect='non-scaling-stroke' />
                  </g>
                );
              })}
            </svg>
            <span className={styles.legend}>{t('legend')}</span>
            {ISO.map((level) => (
              <span
                key={level}
                className={styles.isoLabel}
                style={vars({ '--y': `${y(100 - level / MAX_SHARE)}%` })}
              >
                {decimal(0).format(level)}
              </span>
            ))}
            {[PERFORMANCE_SCORE_THRESHOLDS.greatMin, PERFORMANCE_SCORE_THRESHOLDS.okayMin].map((score) => (
              <span key={score} className={styles.threshold} style={vars({ '--y': `${y(score)}%` })}>
                <b data-grade={getPerformanceGrade(score)}>{tBadges(getPerformanceGrade(score))}</b>
                {score}
              </span>
            ))}
            {PAGES.map((page, i) => {
              const rank = i < 3 ? i + 1 : undefined;
              return (
                <span
                  key={page.key}
                  className={styles.dot}
                  data-rank={rank}
                  data-hot={hot === page.key || undefined}
                  data-left={LABEL_LEFT.has(page.key) || undefined}
                  style={vars({
                    '--x': `${x(page.share)}%`,
                    '--y': `${y(page.score)}%`,
                    '--size': `${10 + page.opportunity * 2.4}px`,
                    '--i': i,
                  })}
                  onMouseEnter={() => setHot(page.key)}
                  onMouseLeave={() => setHot(null)}
                >
                  <i>{rank}</i>
                  <b>{page.key}</b>
                </span>
              );
            })}
          </div>
          <div className={styles.axisX}>
            {[0, 0.1, 0.2, 0.3].map((share) => (
              <span key={share} style={vars({ '--x': `${x(share)}%` })}>
                {percent.format(share)}
              </span>
            ))}
            <em>{t('axisX')}</em>
          </div>
        </div>
      </div>

      <div className={styles.aside}>
        <Heading as='h3' size='title'>
          {t('list')}
        </Heading>
        <ol className={styles.ranks}>
          {top.map((page, i) => (
            <li
              key={page.key}
              data-hot={hot === page.key || undefined}
              onMouseEnter={() => setHot(page.key)}
              onMouseLeave={() => setHot(null)}
            >
              <i aria-hidden>{i + 1}</i>
              <span className={styles.rankText}>
                <b>{page.key}</b>
                <span>
                  {t('share', { share: percent.format(page.share) })}
                  <ScoreBadge score={page.score} />
                </span>
              </span>
              <span className={styles.opportunity}>
                {t('opportunity', { value: decimal(2).format(page.opportunity) })}
              </span>
            </li>
          ))}
        </ol>

        <div className={styles.recipe}>
          <Heading as='h3' size='title'>
            {t('recipe.title')}
          </Heading>
          <span className={styles.weights} aria-hidden>
            {RECIPE.map((metric) => (
              <i
                key={metric}
                style={vars({
                  '--w': PERFORMANCE_SCORE_WEIGHTS[metric],
                  '--of': PERFORMANCE_SCORE_WEIGHTS[metric] / HEAVIEST,
                })}
              >
                <b>{metric}</b>
                {percent.format(PERFORMANCE_SCORE_WEIGHTS[metric])}
              </i>
            ))}
          </span>
          <p className='sr-only'>
            {RECIPE.map((metric) => `${metric} ${percent.format(PERFORMANCE_SCORE_WEIGHTS[metric])}`).join(', ')}
          </p>
          <p className={styles.recipeBody}>{t('recipe.body')}</p>
          <TrackedAnchor
            className={styles.link}
            href={LINKS.vitalsScoreDocs}
            placement='priority'
            destination='docs'
          >
            {t('cta')}
            <ArrowUpRight className='size-3.5' aria-hidden />
          </TrackedAnchor>
        </div>
      </div>
    </InView>
  );
}
