'use client';

import { type Ref, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Check, CircleCheck } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { BrandMark } from '@/landing/components/ui/brandMark';
import { Label } from '@/landing/components/ui/text';
import { cn } from '@/landing/lib/cn';
import { vars } from '@/landing/lib/cssVars';
import { LINKS } from '@/landing/lib/links';
import styles from './statusShowcase.module.css';

const POINTS = ['monitors', 'history', 'updates', 'brand', 'domain'] as const;

const ACCENTS = [
  { name: 'blue', value: '#2f63d6' },
  { name: 'violet', value: '#7347de' },
  { name: 'teal', value: '#0f8a7e' },
  { name: 'ember', value: '#d4572a' },
] as const;

/* Mock data, deliberately untranslated. 45 days, as the real page shows at this width; days count back from
   today, and 0.97 is an amber day, 0.9 a red one (the real page's 95% / 99% cut-offs). */
const DAYS = 45;
const MONITORS = [
  { name: 'Website', uptime: 1, dips: {} as Record<number, number> },
  { name: 'Checkout', uptime: 0.9987, dips: { 4: 0.9, 31: 0.97 } as Record<number, number> },
  { name: 'API', uptime: 0.9998, dips: { 22: 0.97 } as Record<number, number> },
];

const percent = (value: number, locale: string) =>
  new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits: value === 1 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);

/** After app/status/[slug]: brand band, status hero, monitor card, incidents, powered-by. */
function StatusPage({
  theme,
  accent,
  pageRef,
}: {
  theme: 'light' | 'dark';
  accent: string;
  pageRef: Ref<HTMLDivElement>;
}) {
  const t = useTranslations('landing.uptime.status.page');
  const locale = useLocale();
  return (
    <div className={styles.window} aria-hidden data-nosnippet>
      <div className={styles.chrome}>
        <i />
        <i />
        <i />
        <span>status.acme.com</span>
      </div>
      <div ref={pageRef} className={styles.page} data-theme={theme} style={vars({ '--sp-accent': accent })}>
        <div className={styles.band}>
          <b className={styles.brand}>
            <i />
            Acme
          </b>
        </div>
        <div className={styles.card}>
          <div className={styles.hero}>
            <span className={styles.heroIcon}>
              <Check strokeWidth={3} />
            </span>
            <strong>{t('allUp')}</strong>
            <span>{t('updated')}</span>
          </div>
          <div className={styles.monitors}>
            {MONITORS.map((monitor, row) => (
              <div key={monitor.name} className={styles.row}>
                <div className={styles.rowHead}>
                  <span className={styles.rowName}>
                    <CircleCheck />
                    {monitor.name}
                  </span>
                  <span className={styles.rowMeta}>
                    {t('uptime', { value: percent(monitor.uptime, locale) })}
                    <span className={styles.pill} data-tone='ok'>
                      {t('operational')}
                    </span>
                  </span>
                </div>
                <div className={styles.bars}>
                  {Array.from({ length: DAYS }, (_, i) => {
                    const dip = monitor.dips[DAYS - 1 - i];
                    return <i key={i} data-dip={dip === undefined ? undefined : dip < 0.95 ? 'down' : 'warn'} />;
                  })}
                </div>
                {row === MONITORS.length - 1 && (
                  <div className={styles.axis}>
                    <span>{t('ago', { days: DAYS })}</span>
                    <span>{t('today')}</span>
                  </div>
                )}
              </div>
            ))}
            <p className={styles.overall}>
              {t.rich('overall', { uptime: percent(0.9995, locale), value: (chunks) => <b>{chunks}</b> })}
            </p>
          </div>
        </div>
        <p className={styles.pastLabel}>{t('past')}</p>
        <article className={styles.incident}>
          <div className={styles.incidentHead}>
            <span>
              <b>{t('incidentTitle')}</b>
              <span>{t('incidentMeta')}</span>
            </span>
            <span className={styles.pill} data-tone='partial'>
              {t('impact')}
            </span>
          </div>
        </article>
        <p className={styles.powered}>
          {t('poweredBy')}
          <b>
            <BrandMark className='size-3.5' />
            Betterlytics
          </b>
        </p>
      </div>
    </div>
  );
}

export function StatusShowcase() {
  const t = useTranslations('landing.uptime.status');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [accent, setAccent] = useState<string>(ACCENTS[0].value);
  const custom = !ACCENTS.some(({ value }) => value === accent);
  const pageRef = useRef<HTMLDivElement>(null);
  const swatchRef = useRef<HTMLLabelElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);

  // A render per input event trails a fast drag, so the open picker paints the mockup directly
  // and the colour is committed to state when it closes.
  const paint = (value: string) => {
    pageRef.current?.setAttribute('data-picking', '');
    pageRef.current?.style.setProperty('--sp-accent', value);
    swatchRef.current?.style.setProperty('--swatch', value);
  };
  useEffect(() => {
    const picker = pickerRef.current;
    if (!picker) return;
    const commit = () => {
      pageRef.current?.removeAttribute('data-picking');
      setAccent(picker.value);
    };
    picker.addEventListener('change', commit);
    return () => picker.removeEventListener('change', commit);
  }, []);
  return (
    <div className='grid grid-cols-[0.92fr_1.25fr] max-xl:grid-cols-1'>
      <div className='flex flex-col border-r border-rule-10 px-7.5 pt-9 pb-8 transition-ink max-xl:border-r-0 max-xl:border-b max-xl:pt-8 max-sm:px-6'>
        <ul className='grid gap-4.5'>
          {POINTS.map((key) => (
            <li key={key} className='grid grid-cols-[18px_1fr] gap-3 text-body leading-[23px]'>
              <Check className='mt-[3px] size-[17px] text-volt-soft' strokeWidth={2.4} aria-hidden />
              {t(`points.${key}`)}
            </li>
          ))}
        </ul>
        <a
          href={LINKS.status}
          target='_blank'
          rel='noopener'
          className='mt-6 inline-flex items-center gap-2 self-start text-label text-volt-text transition-colors duration-180 ease-out-expo hover:text-fg'
        >
          {t('proof')}
          <ArrowUpRight className='size-3.5' aria-hidden />
        </a>
        <div className='mt-8 border-t border-rule-08 pt-6 transition-ink'>
          <Label className='mb-4 block'>{t('try')}</Label>
          <div className='flex flex-wrap items-center gap-x-7 gap-y-4'>
            <div className={styles.segmented} role='group' aria-label={t('theme')}>
              {(['light', 'dark'] as const).map((value) => (
                <button key={value} type='button' aria-pressed={theme === value} onClick={() => setTheme(value)}>
                  {t(value)}
                </button>
              ))}
            </div>
            <div className='flex gap-2' role='group' aria-label={t('accent')}>
              {ACCENTS.map(({ name, value }) => (
                <button
                  key={value}
                  type='button'
                  aria-label={t(`accents.${name}`)}
                  aria-pressed={accent === value}
                  className={styles.swatch}
                  style={vars({ '--swatch': value })}
                  onClick={() => setAccent(value)}
                />
              ))}
              <label
                ref={swatchRef}
                className={styles.customSwatch}
                data-active={custom || undefined}
                style={custom ? vars({ '--swatch': accent }) : undefined}
              >
                <input
                  ref={pickerRef}
                  type='color'
                  defaultValue={ACCENTS[0].value}
                  aria-label={t('accents.custom')}
                  onInput={(event) => {
                    const { value } = event.currentTarget;
                    paint(value);
                    if (!custom) setAccent(value);
                  }}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
      {/* the window runs off the bottom edge and fades into the hatch there */}
      <div
        className={cn(
          'relative min-h-[540px] min-w-0 overflow-hidden max-xl:h-[520px] max-sm:h-[460px]',
          'bg-hatch',
        )}
      >
        <div className={styles.fade}>
          <StatusPage theme={theme} accent={accent} pageRef={pageRef} />
        </div>
      </div>
    </div>
  );
}
