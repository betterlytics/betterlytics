'use client';

import { useRef, useState } from 'react';
import { Check, ChevronsLeftRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { buttonStyles } from '@/landing/components/ui/button';
import { Label } from '@/landing/components/ui/text';
import { TrackedAnchor } from '@/landing/components/ui/trackedLink';
import { useInView } from '@/landing/hooks/useInView';
import { vars } from '@/landing/lib/cssVars';
import { LINKS } from '@/landing/lib/links';
import { CheckoutMock } from './checkoutMock';
import styles from './maskingShowcase.module.css';

const POINTS = ['text', 'media', 'consent', 'exclude', 'storage'] as const;

export function MaskingShowcase() {
  const t = useTranslations('landing.replay.privacy');
  const ref = useRef<HTMLDivElement>(null);
  const entered = useInView(ref, 'read');
  const [split, setSplit] = useState(50);
  const [touched, setTouched] = useState(false);
  return (
    <div className='grid grid-cols-[0.92fr_1.25fr] max-xl:grid-cols-1'>
      <div className='flex flex-col border-r border-rule-10 px-7.5 py-9 transition-ink max-xl:border-r-0 max-xl:border-b max-xl:py-8 max-sm:px-6'>
        <ul className='grid gap-4.5'>
          {POINTS.map((key) => (
            <li key={key} className='grid grid-cols-[18px_1fr] gap-3 text-body leading-[23px]'>
              <Check className='mt-[3px] size-[17px] text-volt-soft' strokeWidth={2.4} aria-hidden />
              {t(`points.${key}`)}
            </li>
          ))}
        </ul>
        <div className='pt-8'>
          <TrackedAnchor
            className={buttonStyles({ variant: 'line', size: 'sm' })}
            href={`${LINKS.replayDocs}#what-is-recorded`}
            placement='privacy'
            destination='docs'
          >
            {t('docs')}
          </TrackedAnchor>
        </div>
      </div>
      <div className='relative flex min-w-0 flex-col justify-center gap-4 bg-hatch p-9 max-xl:p-7 max-sm:px-(--pad) max-sm:py-6'>
        <p className='sr-only'>{t('alt')}</p>
        <div
          ref={ref}
          className={styles.compare}
          data-in={entered || undefined}
          data-touched={touched || undefined}
          style={vars({ '--pos': `${split}%` })}
        >
          <div className={styles.bar} aria-hidden>
            <i />
            <i />
            <i />
            <span>northwind.coffee/checkout</span>
          </div>
          <div className={styles.view} aria-hidden data-nosnippet>
            <CheckoutMock />
            <div className={styles.replay}>
              <CheckoutMock masked />
            </div>
            <span className={styles.handle}>
              <ChevronsLeftRight />
            </span>
          </div>
          <input
            type='range'
            min={0}
            max={100}
            value={split}
            aria-label={t('slider')}
            aria-valuetext={`${split}%`}
            className={styles.range}
            onChange={(event) => {
              setTouched(true);
              setSplit(Number(event.currentTarget.value));
            }}
          />
          <span className={styles.tag} data-side='visitor' aria-hidden>
            {t('visitor')}
          </span>
          <span className={styles.tag} data-side='replay' aria-hidden>
            {t('you')}
          </span>
        </div>
        <Label className='mt-1.5 self-center text-caption max-sm:mt-0' aria-hidden>
          {t('try')}
        </Label>
      </div>
    </div>
  );
}
