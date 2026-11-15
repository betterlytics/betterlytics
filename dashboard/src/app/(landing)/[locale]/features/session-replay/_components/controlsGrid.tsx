import type { ComponentType } from 'react';
import { Check, Eye, X } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { FeatureGrid } from '@/landing/components/feature/featureGrid';
import grid from '@/landing/components/feature/featureGrid.module.css';
import { vars } from '@/landing/lib/cssVars';
import styles from './controlsGrid.module.css';

type Key = 'sample' | 'errors' | 'paths' | 'light' | 'spa' | 'bots';
type Art = ReturnType<typeof useTranslations<'landing.replay.controls.art'>>;

/* Values are mock data, left literal; labels are copy. */

const comp = `${grid.comp} ${styles.comp}`;

const VISITS = 40;
const SAMPLE = 5;
/** Light-up order as the sample grows; stepping by 23 (coprime with 40) spreads it over the grid. */
const ORDER = [
  13,
  31,
  ...Array.from({ length: VISITS }, (_, i) => (i * 23 + 7) % VISITS).filter((i) => i !== 13 && i !== 31),
];
const RANK = Array.from({ length: VISITS }, (_, i) => ORDER.indexOf(i));
const litBelow = (sample: number) => Math.round((sample / 100) * VISITS);

function Sample({ t }: { t: Art }) {
  return (
    <div className={comp}>
      <div
        className={`${grid.card} ${styles.sampleCard}`}
        style={vars({ '--sample': SAMPLE })}
        data-cursor-sample=''
      >
        <div className={styles.sampleHead}>
          <span>{t('sample')}</span>
          <b data-cursor-sample-value=''>{SAMPLE}%</b>
        </div>
        <span className={styles.sampleTrack}>
          <i data-cursor-knob='' />
        </span>
        <div className={styles.visits}>
          {Array.from({ length: VISITS }, (_, i) => (
            <i
              key={i}
              data-rank={RANK[i]}
              data-lit={RANK[i] < litBelow(SAMPLE) || undefined}
              style={vars({ '--i': i % 20 })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const QUIET = [6, 13, 19, 27, 34, 41, 48];
const BUFFERED = [60, 66, 71, 79, 84];

function Errors({ t }: { t: Art }) {
  return (
    <div className={comp}>
      <div className={`${grid.card} ${styles.tape}`}>
        <span className={styles.window}>
          <span className={styles.windowLabel}>{t('leadUp')}</span>
        </span>
        <span className={styles.ticks}>
          {QUIET.map((x) => (
            <i key={x} style={vars({ '--x': x / 100 })} />
          ))}
          {BUFFERED.map((x) => (
            <i key={x} data-kept style={vars({ '--x': x / 100 })} />
          ))}
          <i data-error style={vars({ '--x': 0.92 })} />
        </span>
      </div>
      <span className={styles.errorChip}>
        <i />
        {t('error')}
      </span>
    </div>
  );
}

const PATHS = [
  { path: '/shop/**', on: true },
  { path: '/checkout', on: true },
  { path: '/billing/**', on: false },
];

function Paths({ t }: { t: Art }) {
  return (
    <div className={comp}>
      <div className={`${grid.card} ${styles.paths}`}>
        {PATHS.map(({ path, on }) => (
          <span key={path} className={styles.pathRow} data-off={!on || undefined} data-cursor-path={path}>
            <code>{path}</code>
            <i className={styles.skeleton} />
            <b>{on ? t('on') : t('off')}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

const REQUESTS = [
  { at: '0:00', method: 'GET', name: 'replay.js', size: 'async' },
  { at: '0:20', method: 'POST', name: '/replay/segment', size: '18 KB' },
  { at: '0:40', method: 'POST', name: '/replay/segment', size: '9 KB' },
  { at: '1:00', method: 'POST', name: '/replay/segment', size: '12 KB' },
];

function Light() {
  return (
    <div className={comp}>
      <div className={`${grid.card} ${styles.network}`}>
        {REQUESTS.map(({ at, method, name, size }, i) => (
          <span key={at} className={styles.request} style={vars({ '--i': i })}>
            <time>{at}</time>
            <b data-method={method}>{method}</b>
            <span>{name}</span>
            <em>{size}</em>
          </span>
        ))}
      </div>
    </div>
  );
}

const ROUTES = [
  { route: '/shop', at: '0:04' },
  { route: '/cart', at: '0:31' },
  { route: '/checkout', at: '1:12' },
];

function Spa({ t }: { t: Art }) {
  return (
    <div className={comp}>
      <div className={`${grid.card} ${styles.urlBar}`} data-cursor-url=''>
        <span className={styles.lock} />
        northwind.coffee
        <span className={styles.route} data-cursor-route=''>
          {ROUTES.map(({ route }, i) => (
            <span key={route} style={vars({ '--i': i })}>
              {route}
            </span>
          ))}
        </span>
      </div>
      <ul className={styles.views}>
        {ROUTES.map(({ route, at }, i) => (
          <li key={route} className={styles.view} style={vars({ '--i': i })} data-cursor-view={i}>
            <time>{at}</time>
            <Eye aria-hidden />
            {t('pageview')}
            <code>{route}</code>
          </li>
        ))}
      </ul>
    </div>
  );
}

const AGENTS = [
  { name: 'Chrome 129', icon: 'chrome', bot: false },
  { name: 'Playwright', icon: 'playwright', bot: true },
  { name: 'Cypress', icon: 'cypress', bot: true },
];

function Bots({ t }: { t: Art }) {
  return (
    <div className={comp}>
      <div className={`${grid.card} ${styles.agents}`}>
        {AGENTS.map(({ name, icon, bot }) => (
          <span key={name} className={styles.agent} data-bot={bot || undefined}>
            <Image src={`/browser-icons/${icon}.svg`} alt='' width={14} height={14} />
            {name}
            <b>
              {bot ? <X aria-hidden /> : <Check aria-hidden />}
              {bot ? t('skipped') : t('recorded')}
            </b>
          </span>
        ))}
      </div>
    </div>
  );
}

const SCENES: Record<Key, ComponentType<{ t: Art }>> = {
  sample: Sample,
  errors: Errors,
  paths: Paths,
  light: Light,
  spa: Spa,
  bots: Bots,
};

const KEYS = Object.keys(SCENES) as Key[];

export function ControlsGrid() {
  const t = useTranslations('landing.replay.controls');
  const art = useTranslations('landing.replay.controls.art');
  return (
    <FeatureGrid
      items={KEYS.map((key) => {
        const Scene = SCENES[key];
        return { key, title: t(`items.${key}.title`), body: t(`items.${key}.body`), scene: <Scene t={art} /> };
      })}
      stageClassName={styles.stage}
      lit={{ key: 'errors', className: styles.litStage }}
    />
  );
}
