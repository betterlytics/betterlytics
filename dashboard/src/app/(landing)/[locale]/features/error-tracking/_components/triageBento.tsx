import type { ReactNode } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye,
  Monitor,
  Plus,
  Smartphone,
} from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { AppleMark, WindowsMark } from '@/landing/components/illustrations/errors';
import { buttonStyles } from '@/landing/components/ui/button';
import { Emphasis } from '@/landing/components/ui/emphasis';
import { InView } from '@/landing/components/ui/inView';
import { Underline } from '@/landing/components/ui/reveal';
import { Heading } from '@/landing/components/ui/text';
import { TrackedAnchor } from '@/landing/components/ui/trackedLink';
import { cn } from '@/landing/lib/cn';
import { vars } from '@/landing/lib/cssVars';
import { LINKS } from '@/landing/lib/links';
import { HoverNumber } from './hoverNumber';
import styles from './triageBento.module.css';

/* Mock data, deliberately untranslated. Each art holds a second state that hovering it swaps in. */

function Swap({ from, to, className }: { from: ReactNode; to: ReactNode; className?: string }) {
  return (
    <span className={cn(styles.swap, className)}>
      <span>{from}</span>
      <span>{to}</span>
    </span>
  );
}

function Cell({ art, title, body }: { art: ReactNode; title: string; body: string }) {
  return (
    <li className={styles.cell}>
      <InView className={styles.art} data-hover-art>
        {art}
      </InView>
      <div className={styles.copy}>
        <Heading as='h3' size='title'>
          {title}
        </Heading>
        <p>{body}</p>
      </div>
    </li>
  );
}

function StatusArt() {
  const t = useTranslations('landing.errors.triage.art');
  const rows = [
    { type: 'TypeError', message: 'Failed to fetch', checked: true },
    { type: 'SyntaxError', message: 'Unexpected token', checked: true },
    { type: 'RangeError', message: 'Maximum call stack', checked: false, picks: true },
  ];
  return (
    <div className={styles.statusArt} aria-hidden data-nosnippet>
      <div className={styles.miniList}>
        {rows.map((row) => (
          <div
            key={row.type}
            className={styles.miniRow}
            data-checked={row.checked || undefined}
            data-picks={row.picks || undefined}
          >
            <i className={styles.box}>
              <Check className='size-2.5' strokeWidth={3} />
            </i>
            <b>{row.type}</b>
            <span>{row.message}</span>
          </div>
        ))}
      </div>
      <div className={styles.actionBar}>
        <span>{t.rich('selected', { count: () => <HoverNumber from={2} to={3} /> })}</span>
        <i />
        <b data-tone='resolve'>{t('resolve')}</b>
        <b>{t('ignore')}</b>
      </div>
    </div>
  );
}

const HISTORY = [2, 1, 3, 2, 1, 0, 2, 3, 1, 2, 4, 2, 1, 3, 2, 2, 1, 3, 2, 4, 3, 2, 3, 2, 5, 4, 18, 41, 66, 92];
const PEAK = Math.max(...HISTORY);

const SPLIT = [
  { name: 'Chrome', icon: '/browser-icons/chrome.svg', share: 64 },
  { name: 'Safari', icon: '/browser-icons/safari.svg', share: 21 },
  { name: 'Firefox', icon: '/browser-icons/firefox.svg', share: 11 },
];

function HistoryArt() {
  const t = useTranslations('landing.errors.triage.art');
  const { format } = new Intl.NumberFormat(useLocale(), { style: 'percent' });
  return (
    <div className={styles.historyArt} aria-hidden data-nosnippet>
      <div className={styles.historyHead}>
        <span>{t('history')}</span>
        <span>{t('days', { count: HISTORY.length })}</span>
      </div>
      <div className={styles.bars}>
        {HISTORY.map((value, i) => (
          <i
            key={i}
            style={vars({ '--h': value / PEAK })}
            data-zero={value === 0 || undefined}
            data-today={i === HISTORY.length - 1 || undefined}
          />
        ))}
      </div>
      <div className={styles.split}>
        {SPLIT.map((browser) => (
          <span key={browser.name}>
            <Image src={browser.icon} alt='' width={13} height={13} />
            {format(browser.share / 100)}
          </span>
        ))}
        <span className={styles.device}>
          <Monitor className='size-3.5' />
          {format(0.71)}
        </span>
      </div>
    </div>
  );
}

/* the Safari counts match the history cell's 21% share; ChunkLoadError keeps all of its occurrences */
const FILTERED = [
  { type: 'TypeError', from: 1206, to: 253 },
  { type: 'ChunkLoadError', from: 58, to: 58, stays: true },
  { type: 'RangeError', from: 9, to: 0, drops: true },
];

function FilterArt() {
  const t = useTranslations('landing.errors.triage.art');
  const value = (chunks: ReactNode) => <b>{chunks}</b>;
  return (
    <div className={styles.filterArt} aria-hidden data-nosnippet>
      <div className={styles.filterBar}>
        <span className={styles.filterPill}>
          <Eye className='size-3.5' />
          {t.rich('pageIs', { value })}
        </span>
        <Swap
          from={
            <span className={styles.addPill}>
              <Plus className='size-3.5' />
              {t('addFilter')}
            </span>
          }
          to={
            <span className={styles.filterPill}>
              <Image src='/browser-icons/safari.svg' alt='' width={13} height={13} />
              {t.rich('browserIs', { value })}
            </span>
          }
        />
      </div>
      <div className={styles.filterList}>
        {FILTERED.map((row) => (
          <div
            key={row.type}
            className={styles.filterRow}
            data-stays={row.stays || undefined}
            data-drops={row.drops || undefined}
          >
            <b>{row.type}</b>
            <HoverNumber from={row.from} to={row.to} />
          </div>
        ))}
      </div>
    </div>
  );
}

function OccurrenceArt() {
  const t = useTranslations('landing.errors.triage.art');
  const { format } = new Intl.NumberFormat(useLocale());
  return (
    <div className={styles.occurrenceArt} aria-hidden data-nosnippet>
      <div className={styles.navigator}>
        <span className={styles.navButtons}>
          <i>
            <ChevronsLeft className='size-3.5' />
          </i>
          <i data-press>
            <ChevronLeft className='size-3.5' />
          </i>
        </span>
        <span className={styles.navLabel}>
          {t.rich('occurrenceOf', {
            number: () => <HoverNumber from={1204} to={1203} />,
            total: format(1206),
          })}
        </span>
        <span className={styles.navButtons}>
          <i>
            <ChevronRight className='size-3.5' />
          </i>
          <i>
            <ChevronsRight className='size-3.5' />
          </i>
        </span>
      </div>
      <Swap
        className={styles.navContext}
        from={
          <>
            <span>
              <Eye className='size-3.5' />
              /pricing
            </span>
            <span>
              <Image src='/browser-icons/safari.svg' alt='' width={13} height={13} />
              Safari 18
            </span>
            <span>
              <AppleMark className='size-[13px]' />
              iOS
            </span>
            <span>
              <Smartphone className='size-3.5' />
              {t('mobile')}
            </span>
          </>
        }
        to={
          <>
            <span>
              <Eye className='size-3.5' />
              /pricing
            </span>
            <span>
              <Image src='/browser-icons/chrome.svg' alt='' width={13} height={13} />
              Chrome 129
            </span>
            <span>
              <WindowsMark className='size-3' />
              Windows
            </span>
            <span>
              <Monitor className='size-3.5' />
              {t('desktop')}
            </span>
          </>
        }
      />
    </div>
  );
}

export function TriageBento() {
  const t = useTranslations('landing.errors.triage');
  return (
    <div className={styles.bento}>
      <div className={styles.lead}>
        <Heading
          as='h2'
          size='display-2'
          id='triage-title'
          className='text-[2rem] leading-8 tracking-[-0.05rem] text-pretty'
        >
          <Emphasis text={t('title')} as={Underline} />
        </Heading>
        <p className={styles.body}>{t('body')}</p>
        <TrackedAnchor
          className={buttonStyles({ variant: 'line', size: 'sm', className: 'self-start' })}
          href={LINKS.errorsDashboardDocs}
          placement='triage'
          destination='docs'
        >
          {t('cta')}
        </TrackedAnchor>
      </div>
      <ul className={styles.cells}>
        <Cell art={<StatusArt />} title={t('items.status.title')} body={t('items.status.body')} />
        <Cell art={<HistoryArt />} title={t('items.history.title')} body={t('items.history.body')} />
        <Cell art={<FilterArt />} title={t('items.filter.title')} body={t('items.filter.body')} />
        <Cell art={<OccurrenceArt />} title={t('items.occurrences.title')} body={t('items.occurrences.body')} />
      </ul>
    </div>
  );
}
