'use client';

import { Fragment, useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { useLocale } from 'next-intl';
import NumberFlow from '@number-flow/react';
import type { Tier } from '@/entities/billing/billing.entities';
import { usePlanFeatures, type PlanFeatureLabel } from '@/components/pricing/usePlanFeatures';
import { EVENT_RANGES, isContactSalesRange } from '@/lib/billing/plans';
import { EVENT_DISPLAY_CAP, formatEventCount } from '@/utils/pricing';
import { buttonStyles } from '@/landing/components/ui/button';
import { Panel } from '@/landing/components/ui/frame';
import { RollLabel } from '@/landing/components/ui/rollLabel';
import { TrackedLink } from '@/landing/components/ui/trackedLink';
import { COPY } from '@/landing/content/copy';
import { track } from '@/landing/lib/analytics';
import { cn } from '@/landing/lib/cn';
import { vars } from '@/landing/lib/cssVars';

const copy = COPY.pricing;
/** The landing page quotes in dollars, as marketing pages conventionally do; billing offers EUR too. */
const CURRENCY = 'USD';
/** The page's copy is English, so its figures are too: 1M and 10M+, not the browser locale's 1 mio. */
const NUMBER_LOCALE = 'en';
/** Every plan price is whole dollars, so the cents go: '$39', not '$39.00'. */
const PRICE_FORMAT = { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 } as const;
const COMPACT = { notation: 'compact' } as const;
/** NumberFlow pads its box for the roll's mask; pulling the margins in by as much lets a big figure lay out like text. */
const FLUSH = '[--number-flow-mask-height:0.25em] -my-(--number-flow-mask-height)';

/** The selected volume, and its figure as the shared feature labels spell it. */
type SelectedVolume = { value: number; figure: string };

/** An event volume in compact notation, with a plus past the display cap. */
function Volume({ value, className }: { value: number; className?: string }) {
  return (
    <NumberFlow
      className={className}
      value={Math.min(value, EVENT_DISPLAY_CAP)}
      locales={NUMBER_LOCALE}
      format={COMPACT}
      suffix={value > EVENT_DISPLAY_CAP ? '+' : undefined}
      willChange
    />
  );
}

/** Text with the volume figure inside it; the figure animates, the words around it stay. */
function WithVolume({ text, volume }: { text: string; volume: SelectedVolume }) {
  return (
    <span>
      {text.split(volume.figure).map((part, i) => (
        <Fragment key={i}>
          {i > 0 && <Volume value={volume.value} />}
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

/** A plan's call to action; the page it leads to is also what its click reports. */
type PlanCta = { label: string; destination: 'signup' | 'contact' };

type PlanProps = {
  tier: Tier;
  name: string;
  tagline: string;
  /** Cents, or a word such as 'Custom' when the price is not a number. */
  price: number | string;
  period?: string;
  badge?: string;
  features: PlanFeatureLabel[];
  cta: PlanCta;
  /** The recommended tier. */
  pick?: boolean;
  /** So the feature line that quotes the volume can animate it. */
  volume: SelectedVolume;
};

function Plan({ tier, name, tagline, price, period, badge, features, cta, pick, volume }: PlanProps) {
  return (
    <div
      className={cn(
        'relative flex flex-1 flex-col border-rule-10 p-9 transition-ink not-first:border-l first:pl-0',
        'max-lg:px-0 max-lg:py-7 max-lg:not-first:border-t max-lg:not-first:border-l-0',
        // the recommended tier reads heavier through a tint and a blue top rule, not a scale transform
        pick && 'bg-volt/10 shadow-[inset_0_2px_0_var(--color-volt-lift)] max-lg:px-4',
      )}
    >
      <div className='mb-3 flex items-center gap-3'>
        <h3 className='text-[20px] font-medium tracking-[-0.35px] text-fg'>{name}</h3>
        {badge ? (
          // not a floating pill: a solid tab hanging flush under the column's blue top rule,
          // part of the structure, like the title block on a drawing
          <span className='absolute top-0.5 right-9 rounded-b-[5px] bg-volt-lift px-[9px] pt-1 pb-[5px] text-[11.5px] font-medium tracking-[-0.1px] whitespace-nowrap text-on-volt'>
            {badge}
          </span>
        ) : null}
      </div>
      {/* a fixed line whether the price is a figure or a word, so the block never jumps
          when Free becomes a number and the three plans stay level */}
      <div className='mb-2.5 flex h-11 items-baseline gap-1.5'>
        <b className='text-[42px] leading-11 font-medium tracking-[-1.5px] tabular-nums'>
          {typeof price === 'number' ? (
            <NumberFlow
              className={FLUSH}
              value={price / 100}
              locales={NUMBER_LOCALE}
              format={PRICE_FORMAT}
              willChange
            />
          ) : (
            price
          )}
        </b>
        {period ? <span className='text-body-sm tracking-ui text-muted'>{period}</span> : null}
      </div>
      {/* two lines tall, so the rules below stay level when one tagline wraps */}
      <p className='min-h-11 text-body-sm leading-[22px] text-muted'>{tagline}</p>
      <ul className='mt-3 mb-[26px] border-t border-rule-08 pt-[22px] transition-ink'>
        {/* keyed by position, not label: the volume line's text changes with the slider and must keep its element to animate */}
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

/**
 * Real plan data in the draft's panel. The event-volume slider stands where the
 * draft had a monthly/annual toggle: there is no annual billing, and volume is
 * the thing the price actually moves on. Features come from the shared plan
 * definition so this can't drift from the pricing page.
 */
export function PricingPanel() {
  const appLocale = useLocale();
  const [rangeIndex, setRangeIndex] = useState(0);

  const range = EVENT_RANGES[rangeIndex];
  const lastIndex = EVENT_RANGES.length - 1;
  const contactSales = isContactSalesRange(range);
  const featuresFor = usePlanFeatures(range);

  const cents = (tier: 'growth' | 'professional') => range[tier].price.usd_cents;
  const price = (c: number) => (contactSales ? copy.custom : c === 0 ? copy.free : c);
  const period = (c: number) => (contactSales || c === 0 ? undefined : copy.perMonth);
  const sales: PlanCta = { label: copy.enterprise.cta, destination: 'contact' };
  const growthCents = cents('growth');
  // the figure as the shared feature hook spells it, so the volume line can be split around it
  const volume = { value: range.value, figure: formatEventCount(range.value, appLocale) };

  // A caption jumps straight to its stop, so picking one settles the slider as a commit
  // would; picking the current one changes nothing and reports nothing.
  const pickStop = (index: number) => {
    if (index === rangeIndex) return;
    setRangeIndex(index);
    track.pricingVolume(EVENT_RANGES[index].value);
  };

  return (
    <>
      <div className='mx-auto mb-11 flex w-full max-w-[640px] flex-col items-center gap-3.5'>
        <div className='flex items-baseline gap-2'>
          <b className='text-[26px] leading-7 font-medium tracking-[-0.8px] tabular-nums'>
            <Volume value={range.value} className={FLUSH} />
          </b>
          <span className='text-label tracking-ui text-muted'>{copy.monthlyEvents}</span>
        </div>
        <Slider.Root
          className='relative flex h-7 w-full cursor-pointer touch-none items-center select-none'
          value={[rangeIndex]}
          onValueChange={([v]) => setRangeIndex(v)}
          // once the drag or key press settles on a new stop, not for every stop passed
          onValueCommit={([v]) => track.pricingVolume(EVENT_RANGES[v].value)}
          min={0}
          max={lastIndex}
          step={1}
        >
          {/* a flat track: the value is carried by the filled segment, not by the thumb */}
          <Slider.Track className='relative h-1 flex-1 overflow-hidden rounded-xs bg-fg/14'>
            <Slider.Range className='absolute h-full rounded-xs bg-volt-lift' />
          </Slider.Track>
          {/* a single flat disc with one border so it lifts off the fill; the halo only
              appears for keyboard focus and while dragging */}
          <Slider.Thumb
            className='block size-4.5 cursor-grab rounded-full border-2 border-canvas bg-volt-lift transition-[scale,box-shadow] duration-120 ease-[ease-out] hover:scale-112 focus-visible:ring-5 focus-visible:ring-volt-lift/28 focus-visible:outline-hidden active:scale-112 active:cursor-grabbing active:ring-5 active:ring-volt-lift/28'
            aria-label={copy.rangeLabel}
            // announce the volume, not the stop's position on the slider
            aria-valuetext={copy.rangeValueText(formatEventCount(range.value, NUMBER_LOCALE))}
          />
        </Slider.Root>
        {/* A caption under every stop, each a shortcut to it; the current one is bright.
            Inset by the thumb's radius, so each caption sits under the thumb's centre. */}
        <div className='relative -mt-0.5 h-4.5 w-full' role='group' aria-label={copy.monthlyEvents}>
          {EVENT_RANGES.map((r, i) => (
            <button
              key={r.value}
              type='button'
              className='absolute top-0 left-[calc(9px+(100%-18px)*var(--stop))] -translate-x-1/2 px-1 py-0.5 font-mono text-micro tracking-[0.04em] whitespace-nowrap text-muted transition-[color] duration-200 ease-out-expo hover:text-fg aria-pressed:font-medium aria-pressed:text-fg'
              style={vars({ '--stop': i / lastIndex })}
              aria-pressed={i === rangeIndex}
              onClick={() => pickStop(i)}
            >
              {formatEventCount(r.value, NUMBER_LOCALE)}
            </button>
          ))}
        </div>
      </div>

      <Panel>
        <div className='flex max-lg:flex-col'>
          <Plan
            tier='growth'
            volume={volume}
            name={copy.growth.name}
            tagline={copy.growth.tagline}
            price={price(growthCents)}
            period={period(growthCents)}
            features={featuresFor('growth')}
            cta={
              contactSales
                ? sales
                : { label: growthCents === 0 ? copy.growth.ctaFree : copy.growth.cta, destination: 'signup' }
            }
          />
          <Plan
            tier='professional'
            volume={volume}
            pick
            name={copy.professional.name}
            badge={copy.professional.badge}
            tagline={copy.professional.tagline}
            price={price(cents('professional'))}
            period={period(cents('professional'))}
            features={featuresFor('professional')}
            cta={contactSales ? sales : { label: copy.professional.cta, destination: 'signup' }}
          />
          <Plan
            tier='enterprise'
            volume={volume}
            name={copy.enterprise.name}
            tagline={copy.enterprise.tagline}
            price={copy.custom}
            features={featuresFor('enterprise')}
            cta={sales}
          />
        </div>
      </Panel>
    </>
  );
}
