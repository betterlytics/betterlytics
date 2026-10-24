import type { ComponentType } from 'react';
import { Check, Eye, X } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Stage } from '@/landing/components/feature/stage';
import { Corners } from '@/landing/components/ui/frame';
import { Reveal } from '@/landing/components/ui/reveal';
import ruled from '@/landing/components/ui/ruledGrid.module.css';
import { cn } from '@/landing/lib/cn';
import { vars } from '@/landing/lib/cssVars';
import styles from './controlsGrid.module.css';

type Key = 'sample' | 'errors' | 'paths' | 'light' | 'spa' | 'bots';
type Art = ReturnType<typeof useTranslations<'landing.replay.controls.art'>>;

/* Values are mock data, left literal; labels are copy. Each scene is a fixed 300×140 composition. */

const VISITS = 40;
const SAMPLE = 5;
/** The order visits light up in as the sample grows; a step coprime with 40 spreads them over the grid. */
const ORDER = [
  13,
  31,
  ...Array.from({ length: VISITS }, (_, i) => (i * 23 + 7) % VISITS).filter((i) => i !== 13 && i !== 31),
];
const RANK = Array.from({ length: VISITS }, (_, i) => ORDER.indexOf(i));
const litBelow = (sample: number) => Math.round((sample / 100) * VISITS);

function Sample({ t }: { t: Art }) {
  return (
    <div className={styles.comp}>
      <div
        className={`${styles.card} ${styles.sampleCard}`}
        style={vars({ '--sample': SAMPLE })}
        data-replay-sample=''
      >
        <div className={styles.sampleHead}>
          <span>{t('sample')}</span>
          <b data-replay-sample-value=''>{SAMPLE}%</b>
        </div>
        <span className={styles.sampleTrack}>
          <i data-replay-knob='' />
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
    <div className={styles.comp}>
      <div className={`${styles.card} ${styles.tape}`}>
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
    <div className={styles.comp}>
      <div className={`${styles.card} ${styles.paths}`}>
        {PATHS.map(({ path, on }) => (
          <span key={path} className={styles.pathRow} data-off={!on || undefined} data-replay-path={path}>
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
    <div className={styles.comp}>
      <div className={`${styles.card} ${styles.network}`}>
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
    <div className={styles.comp}>
      <div className={`${styles.card} ${styles.urlBar}`} data-replay-url=''>
        <span className={styles.lock} />
        northwind.coffee
        <span className={styles.route} data-replay-route=''>
          {ROUTES.map(({ route }, i) => (
            <span key={route} style={vars({ '--i': i })}>
              {route}
            </span>
          ))}
        </span>
      </div>
      <ul className={styles.views}>
        {ROUTES.map(({ route, at }, i) => (
          <li key={route} className={styles.view} style={vars({ '--i': i })} data-replay-view={i}>
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
    <div className={styles.comp}>
      <div className={`${styles.card} ${styles.agents}`}>
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
    <ul className={cn(ruled.grid, ruled.cols3)}>
      {KEYS.map((key, i) => {
        const Scene = SCENES[key];
        return (
          <li key={key} className={styles.cell}>
            <Corners />
            <Stage className={key === 'errors' ? `${styles.stage} ${styles.litStage}` : styles.stage}>
              <Scene t={art} />
            </Stage>
            <Reveal index={i % 3} className={styles.copy}>
              <h3 className='text-title leading-6 font-medium tracking-ui'>{t(`items.${key}.title`)}</h3>
              <p className='mt-2 text-label leading-[22px] text-muted'>{t(`items.${key}.body`)}</p>
            </Reveal>
          </li>
        );
      })}
    </ul>
  );
}
