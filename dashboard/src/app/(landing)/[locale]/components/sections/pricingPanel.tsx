'use client';

import { Fragment, useRef, useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import NumberFlow from '@number-flow/react';
import { useLocale, useTranslations } from 'next-intl';
import { EventCountFlow } from '@/components/pricing/EventCountFlow';
import { usePlanFeatures, type PlanFeatureLabel } from '@/components/pricing/usePlanFeatures';
import {
  VOLUME_STOPS,
  isQuoted,
  isFreeBand,
  listedPlans,
  priceFor,
  type PlanId,
} from '@/lib/billing/catalog';
import { formatEventCount } from '@/utils/pricing';
import { buttonStyles } from '@/landing/components/ui/button';
import { Panel } from '@/landing/components/ui/frame';
import { RollLabel } from '@/landing/components/ui/rollLabel';
import { TrackedLink } from '@/landing/components/ui/trackedLink';
import { useInView } from '@/landing/hooks/useInView';
import { track } from '@/landing/lib/analytics';
import { cn } from '@/landing/lib/cn';
import { vars } from '@/landing/lib/cssVars';
import styles from './pricingPanel.module.css';

/** USD only here, though billing also offers EUR. */
const CURRENCY = 'USD';
const PRICE_FORMAT = { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 } as const;
/** Cancels NumberFlow's mask padding so a figure lays out like text. */
const FLUSH = '[--number-flow-mask-height:0.25em] -my-(--number-flow-mask-height)';

type SelectedVolume = { value: number; figure: string };

function WithVolume({ text, volume }: { text: string; volume: SelectedVolume }) {
  return (
    <span>
      {text.split(volume.figure).map((part, i) => (
        <Fragment key={i}>
          {i > 0 && <EventCountFlow value={volume.value} />}
          {part}
        </Fragment>
      ))}
    </span>
  );
}

function Check() {
  return (
    <svg className='mt-[3px] size-3.5 flex-none text-volt-soft' viewBox='0 0 16 16' fill='none' aria-hidden>
      <path
        d='M3 8.4 6.2 11.6 13 4.8'
        stroke='currentColor'
        strokeWidth='1.9'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

type PlanCta = { label: string; destination: 'signup' | 'contact' };

type PlanProps = {
  tier: PlanId;
  name: string;
  tagline: string;
  /** Cents, or a label such as 'Custom'. */
  price: number | string;
  period?: string;
  badge?: string;
  features: PlanFeatureLabel[];
  cta: PlanCta;
  pick?: boolean;
  volume: SelectedVolume;
};

function Plan({ tier, name, tagline, price, period, badge, features, cta, pick, volume }: PlanProps) {
  const locale = useLocale();
  return (
    <div
      className={cn(
        'relative flex flex-1 flex-col border-rule-10 p-9 transition-ink not-first:border-l first:pl-0',
        'max-lg:px-0 max-lg:py-7 max-lg:not-first:border-t max-lg:not-first:border-l-0 max-sm:px-(--pad) max-sm:first:pl-(--pad)',
        pick && 'bg-volt/10 shadow-[inset_0_2px_0_var(--color-volt-lift)] max-lg:px-4 max-sm:px-(--pad)',
      )}
    >
      <div className='mb-1 flex items-center gap-3'>
        <h3 className='text-[20px] font-medium tracking-[-0.35px] text-fg'>{name}</h3>
        {badge ? (
          <span className='absolute top-0.5 right-9 rounded-b-[5px] bg-volt-lift px-[9px] pt-1 pb-[5px] text-[11.5px] font-medium tracking-[-0.1px] whitespace-nowrap text-on-volt'>
            {badge}
          </span>
        ) : null}
      </div>
      {/* two lines tall so prices stay level across columns when a tagline wraps */}
      <p className='mb-4 min-h-11 text-body-sm leading-[22px] text-muted max-lg:min-h-0'>{tagline}</p>
      {/* fixed height so swapping a figure for a word doesn't shift the plans */}
      <div className='mb-2.5 flex h-11 items-baseline gap-1.5'>
        <b className='text-[42px] leading-11 font-medium tracking-[-1.5px] tabular-nums'>
          {typeof price === 'number' ? (
            <NumberFlow className={FLUSH} value={price / 100} locales={locale} format={PRICE_FORMAT} willChange />
          ) : (
            price
          )}
        </b>
        {period ? <span className='text-body-sm tracking-ui text-muted'>{period}</span> : null}
      </div>
      <ul className='mt-3 mb-[26px] border-t border-rule-08 pt-[22px] transition-ink'>
        {/* index key: the volume line's text changes but it must keep its element to animate */}
        {features.map((f, i) => (
          <li
            key={i}
            className={cn(
              'flex items-start gap-[11px] py-[7px] text-body-sm leading-[21px] tracking-ui text-fg opacity-84',
              f.kind === 'header' && 'pb-[11px] font-semibold opacity-100',
            )}
          >
            <Check />
            <WithVolume text={f.label} volume={volume} />
          </li>
        ))}
      </ul>
      <TrackedLink
        className={buttonStyles({ variant: pick ? 'volt' : 'line', className: 'group mt-auto w-full p-[13px]' })}
        href={`/${cta.destination}`}
        placement='pricing'
        destination={cta.destination}
        plan={tier}
      >
        <RollLabel text={cta.label} />
      </TrackedLink>
    </div>
  );
}

export function PricingPanel() {
  const t = useTranslations('landing.pricing');
  const locale = useLocale();
  const [rangeIndex, setRangeIndex] = useState(0);
  const sliderRef = useRef<HTMLSpanElement>(null);
  // drives the phone thumb nudge in the module
  const sliderSeen = useInView(sliderRef, 'read');

  const events = VOLUME_STOPS[rangeIndex];
  const lastIndex = VOLUME_STOPS.length - 1;
  const featuresFor = usePlanFeatures(events);

  const sales: PlanCta = { label: t('enterprise.cta'), destination: 'contact' };
  // spelled as the shared feature labels spell it, so WithVolume can split on it
  const volume = { value: events, figure: formatEventCount(events, locale) };

  const pickStop = (index: number) => {
    if (index === rangeIndex) return;
    setRangeIndex(index);
    track.pricingVolume(VOLUME_STOPS[index]);
  };

  return (
    <>
      <div className='mx-auto mb-11 flex w-full max-w-[640px] flex-col items-center gap-3.5'>
        <div className='flex items-baseline gap-2'>
          <b className='text-[26px] leading-7 font-medium tracking-[-0.8px] tabular-nums'>
            <EventCountFlow value={events} className={FLUSH} />
          </b>
          <span className='text-label tracking-ui text-muted'>{t('monthlyEvents')}</span>
        </div>
        <Slider.Root
          ref={sliderRef}
          className={cn(
            styles.slider,
            'relative flex h-7 w-full cursor-pointer touch-none items-center select-none',
          )}
          data-seen={sliderSeen || undefined}
          value={[rangeIndex]}
          onValueChange={([v]) => setRangeIndex(v)}
          onValueCommit={([v]) => track.pricingVolume(VOLUME_STOPS[v])}
          min={0}
          max={lastIndex}
          step={1}
        >
          <Slider.Track className='relative h-1 flex-1 overflow-hidden rounded-xs bg-fg/14'>
            <Slider.Range className='absolute h-full rounded-xs bg-volt-lift' />
          </Slider.Track>
          {/* 44px touch area on phones: 20px inside the 2px border plus 12px each side */}
          <Slider.Thumb
            className={cn(
              styles.thumb,
              'relative block size-4.5 cursor-grab rounded-full border-2 border-canvas bg-volt-lift transition-[scale,box-shadow] duration-120 ease-[ease-out] hover:scale-112 active:scale-112 active:cursor-grabbing active:ring-5 active:ring-volt-lift/28',
              'max-sm:size-6 max-sm:before:absolute max-sm:before:-inset-3',
            )}
            aria-label={t('rangeLabel')}
            aria-valuetext={t('rangeValueText', { events: formatEventCount(events, locale) })}
          />
        </Slider.Root>
        {/* inset by the 9px thumb radius; aria-hidden since the slider already serves keyboards and screen readers */}
        <div className='relative -mt-0.5 h-4.5 w-full' aria-hidden>
          {VOLUME_STOPS.map((stop, i) => (
            <button
              key={stop}
              type='button'
              tabIndex={-1}
              className={cn(
                'absolute top-0 left-[calc(9px+(100%-18px)*var(--stop))] -translate-x-1/2 px-1 py-0.5 text-micro whitespace-nowrap text-muted tabular-nums transition-[color] duration-200 ease-out-expo hover:text-fg data-active:font-medium data-active:text-fg',
                // phones show every other stop and the last; its neighbour would collide in long locales ("10 mio.+")
                (i % 2 === 1 || i === lastIndex - 1) && i !== lastIndex && 'max-sm:hidden',
              )}
              style={vars({ '--stop': i / lastIndex })}
              data-active={i === rangeIndex || undefined}
              onClick={() => pickStop(i)}
            >
              {formatEventCount(stop, locale)}
            </button>
          ))}
        </div>
      </div>

      <Panel>
        <div className='flex max-lg:flex-col max-sm:-mx-(--pad)'>
          {listedPlans().map((plan) => {
            const quoted = isQuoted(plan, events);
            const cents = quoted ? null : priceFor(plan, events, CURRENCY);
            const free = isFreeBand(plan, events);
            return (
              <Plan
                key={plan.id}
                tier={plan.id}
                volume={volume}
                pick={plan.featured}
                name={plan.name}
                badge={plan.featured ? t('badge') : undefined}
                tagline={t(`${plan.id}.tagline`)}
                price={cents === null ? t('custom') : free ? t('free') : cents}
                period={cents === null || free ? undefined : t('perMonth')}
                features={featuresFor(plan)}
                cta={
                  quoted
                    ? sales
                    : { label: free ? t('ctaFree') : t(`${plan.id}.cta`), destination: 'signup' }
                }
              />
            );
          })}
        </div>
      </Panel>
    </>
  );
}
