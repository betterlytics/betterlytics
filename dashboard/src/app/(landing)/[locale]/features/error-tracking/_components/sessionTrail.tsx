import type { ReactNode } from 'react';
import { AlertTriangle, Eye, Monitor, MousePointerClick, type LucideIcon } from 'lucide-react';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { AppleMark } from '@/landing/components/illustrations/errors';
import { FLAGS } from '@/landing/components/illustrations/flags';
import { InView } from '@/landing/components/ui/inView';
import { PLAN_ERROR } from '@/landing/content/planError';
import { cn } from '@/landing/lib/cn';
import { vars } from '@/landing/lib/cssVars';
import styles from './sessionTrail.module.css';

/* Mock data, deliberately untranslated. */

type Kind = 'page' | 'event' | 'error';
type Entry = { at: string; kind: Kind; label: string; current?: boolean };

const MESSAGE = PLAN_ERROR.message;

const BEFORE: Entry[] = [
  { at: '12:03:41', kind: 'page', label: '/' },
  { at: '12:03:58', kind: 'page', label: '/pricing' },
  { at: '12:04:18', kind: 'event', label: 'plan_selected' },
];
const THROWN: Entry[] = [{ at: '12:04:19', kind: 'error', label: MESSAGE, current: true }];
const AFTER: Entry[] = [
  { at: '12:04:31', kind: 'page', label: '/pricing' },
  { at: '12:04:37', kind: 'event', label: 'plan_selected' },
  { at: '12:04:37', kind: 'error', label: MESSAGE },
  { at: '12:05:02', kind: 'page', label: '/contact' },
];
const TOTAL = BEFORE.length + THROWN.length + AFTER.length;

const MORE_FRAMES = 4;

const GLYPHS: Record<Kind, LucideIcon> = { page: Eye, event: MousePointerClick, error: AlertTriangle };

function Stretch({
  row,
  entries,
  from,
  label,
  detail,
  className,
  children,
}: {
  row: number;
  entries: Entry[];
  from: number;
  label: string;
  detail?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  const after = from + entries.length;
  return (
    <>
      <ol
        className={styles.group}
        style={vars({ '--row': row, '--i': after })}
        data-error={entries.some((entry) => entry.current) || undefined}
        aria-hidden
        data-nosnippet
      >
        {entries.map((entry, i) => {
          const Glyph = GLYPHS[entry.kind];
          return (
            <li
              key={`${entry.at}-${entry.kind}`}
              className={styles.entry}
              data-kind={entry.kind}
              data-current={entry.current || undefined}
              style={vars({ '--i': from + i })}
            >
              <time>{entry.at}</time>
              <span className={styles.glyph}>
                <Glyph />
              </span>
              <span className={styles.label}>
                {entry.kind === 'error' && <b>{PLAN_ERROR.type} </b>}
                {entry.label}
              </span>
            </li>
          );
        })}
        {detail && (
          <li className={styles.detail} style={vars({ '--i': after })}>
            {detail}
          </li>
        )}
      </ol>
      <div className={cn(styles.note, className)} style={vars({ '--row': row, '--i': after })}>
        <span className={styles.noteLabel}>{label}</span>
        {children}
      </div>
    </>
  );
}

export function SessionTrail() {
  const t = useTranslations('landing.errors.trail');
  const locale = useLocale();
  const region = new Intl.DisplayNames([locale], { type: 'region' }).of('DK');
  return (
    <InView className={styles.trail}>
      <p className='sr-only' data-nosnippet>
        {t('alt')}
      </p>
      <div className={styles.card} aria-hidden />
      <div className={styles.head} aria-hidden data-nosnippet>
        <b>{t('label')}</b>
        <span>{t('count', { count: TOTAL })}</span>
      </div>

      <Stretch row={2} entries={BEFORE} from={0} label={t('before.label')}>
        <p className={styles.noteBody}>{t('before.body')}</p>
      </Stretch>

      <Stretch
        row={3}
        entries={THROWN}
        from={BEFORE.length}
        label={t('thrown.label')}
        className={styles.thrownNote}
        detail={
          <>
            <div className={styles.stack}>
              <div className={styles.stackHead}>
                <b>{t('thrown.stacktrace')}</b>
                <span>{t('thrown.mechanism')}</span>
              </div>
              <ol>
                {PLAN_ERROR.frames.map((frame) => (
                  <li key={frame.fn} className={styles.frame}>
                    <span className={styles.frameLine}>{frame.line}</span>
                    <span className={styles.call}>
                      at <b>{frame.fn}</b> ({frame.file})
                    </span>
                    <span className={styles.inApp}>{t('thrown.inApp')}</span>
                  </li>
                ))}
              </ol>
              <span className={styles.more}>{t('thrown.more', { count: MORE_FRAMES })}</span>
            </div>
            <div className={styles.context}>
              <span>
                <Image src='/browser-icons/chrome.svg' alt='' width={13} height={13} />
                Chrome 129
              </span>
              <span>
                <AppleMark className='size-[13px]' />
                macOS
              </span>
              <span>
                <Monitor className='size-[13px]' />
                {t('thrown.desktop')}
              </span>
              <span>
                <FLAGS.DK className='h-[9px] w-[13.5px] rounded-[1.5px] ring-1 ring-white/8' title={region} />
                {region}
              </span>
            </div>
          </>
        }
      >
        <p className={styles.noteBody}>{t('thrown.body')}</p>
      </Stretch>

      <Stretch
        row={4}
        entries={AFTER}
        from={BEFORE.length + THROWN.length}
        label={t('after.label')}
        className={styles.afterNote}
      >
        <p className={styles.noteBody}>{t('after.body')}</p>
      </Stretch>
    </InView>
  );
}
