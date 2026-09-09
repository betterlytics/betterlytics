'use client';

import { Fragment, useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { useLocale } from 'next-intl';
import NumberFlow from '@number-flow/react';
import { Link } from '@/i18n/navigation';
import type { Tier } from '@/entities/billing/billing.entities';
import { usePlanFeatures, type PlanFeatureLabel } from '@/components/pricing/usePlanFeatures';
import { EVENT_RANGES, isContactSalesRange } from '@/lib/billing/plans';
import { EVENT_DISPLAY_CAP, formatEventCount } from '@/utils/pricing';
import { cn } from '@/lib/utils';
import { Panel } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/frame';
import { RollLabel } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/rollLabel';
import { COPY } from '@/app/(app)/[locale]/(landing-v2)/v2/content/copy';

const copy = COPY.pricing;
/** The landing page quotes in dollars, as marketing pages conventionally do; billing offers EUR too. */
const CURRENCY = 'USD';
/** The page's copy is English, so its figures are too: 1M and 10M+, not the browser locale's 1 mio. */
const NUMBER_LOCALE = 'en';
/** Every plan price is whole dollars, so the cents go: '$39', not '$39.00'. */
const PRICE_FORMAT = { style: 'currency', currency: CURRENCY, maximumFractionDigits: 0 } as const;
const COMPACT = { notation: 'compact' } as const;

/** An event volume in compact notation, with a plus past the display cap. */
function Volume({ value, locale }: { value: number; locale: string }) {
  return (
    <NumberFlow
      value={Math.min(value, EVENT_DISPLAY_CAP)}
      locales={locale}
      format={COMPACT}
      suffix={value > EVENT_DISPLAY_CAP ? '+' : undefined}
      willChange
    />
  );
}

/** Text with the volume figure inside it; the figure animates, the words around it stay. */
function WithVolume({
  text,
  figure,
  value,
  locale,
}: {
  text: string;
  figure: string;
  value: number;
  locale: string;
}) {
  const parts = text.split(figure);
  return (
    <span>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {i > 0 && <Volume value={value} locale={locale} />}
          {part}
        </Fragment>
      ))}
    </span>
  );
}

function Check() {
  return (
    <svg viewBox='0 0 16 16' fill='none' aria-hidden>
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

type PlanProps = {
  tier: Tier;
  name: string;
  tagline: string;
  /** Cents, or a word such as 'Custom' when the price is not a number. */
  price: number | string;
  period?: string;
  badge?: string;
  features: PlanFeatureLabel[];
  cta: { label: string; href: '/signup' | '/contact' };
  pick?: boolean;
  /** The selected volume and its formatted figure, so the feature line that quotes it can animate it. */
  volume: { value: number; figure: string };
  locale: string;
};

function Plan({ name, tagline, price, period, badge, features, cta, pick, volume, locale }: PlanProps) {
  return (
    <div className={cn('plan', pick && 'plan--pick')}>
      <div className='plan__hd'>
        <span className='plan__name'>{name}</span>
        {badge ? <span className='plan__badge'>{badge}</span> : null}
      </div>
      <div className='plan__pr'>
        <b>
          {typeof price === 'number' ? (
            <NumberFlow value={price / 100} locales={locale} format={PRICE_FORMAT} willChange />
          ) : (
            price
          )}
        </b>
        {period ? <em>{period}</em> : null}
      </div>
      <p className='plan__sub'>{tagline}</p>
      <ul>
        {/* keyed by position, not label: the volume line's text changes with the slider and must keep its element to animate */}
        {features.map((f, i) => (
          <li key={i} className={cn(f.kind === 'header' && 'is-head')}>
            <Check />
            <WithVolume text={f.label} figure={volume.figure} value={volume.value} locale={locale} />
          </li>
        ))}
      </ul>
      <Link className={cn('btn', pick ? 'btn--volt' : 'btn--line')} href={cta.href}>
        <RollLabel text={cta.label} />
      </Link>
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
  const locale = NUMBER_LOCALE;
  const appLocale = useLocale();
  const [rangeIndex, setRangeIndex] = useState(0);

  const range = EVENT_RANGES[rangeIndex];
  const lastIndex = EVENT_RANGES.length - 1;
  const contactSales = isContactSalesRange(range);
  const featuresFor = usePlanFeatures(range);

  const cents = (tier: 'growth' | 'professional') => range[tier].price.usd_cents;
  const price = (c: number) => (contactSales ? copy.custom : c === 0 ? copy.free : c);
  const period = (c: number) => (contactSales || c === 0 ? undefined : copy.perMonth);
  const sales = { label: copy.enterprise.cta, href: '/contact' } as const;
  const growthCents = cents('growth');
  // the figure as the shared feature hook spells it, so the volume line can be split around it
  const volume = { value: range.value, figure: formatEventCount(range.value, appLocale) };

  return (
    <>
      <div className='range'>
        <div className='range__val'>
          <b>
            <Volume value={range.value} locale={locale} />
          </b>
          <span>{copy.monthlyEvents}</span>
        </div>
        <Slider.Root
          className='range__slider'
          value={[rangeIndex]}
          onValueChange={([v]) => setRangeIndex(v)}
          min={0}
          max={lastIndex}
          step={1}
          aria-label={copy.rangeLabel}
        >
          <Slider.Track className='range__track'>
            <Slider.Range className='range__fill' />
          </Slider.Track>
          <Slider.Thumb className='range__thumb' />
        </Slider.Root>
        {/* a caption under every stop, each a shortcut to it; the current one is bright */}
        <div className='range__stops'>
          {EVENT_RANGES.map((r, i) => (
            <button
              key={r.value}
              type='button'
              className={cn(i === rangeIndex && 'is-on')}
              style={{ left: `calc(11px + (100% - 22px) * ${i / lastIndex})` }}
              onClick={() => setRangeIndex(i)}
            >
              {formatEventCount(r.value, locale)}
            </button>
          ))}
        </div>
      </div>

      <Panel>
        <div className='plans'>
          <Plan
            tier='growth'
            volume={volume}
            locale={locale}
            name={copy.growth.name}
            tagline={copy.growth.tagline}
            price={price(growthCents)}
            period={period(growthCents)}
            features={featuresFor('growth')}
            cta={
              contactSales
                ? sales
                : { label: growthCents === 0 ? copy.growth.ctaFree : copy.growth.cta, href: '/signup' }
            }
          />
          <Plan
            tier='professional'
            volume={volume}
            locale={locale}
            pick
            name={copy.professional.name}
            badge={copy.professional.badge}
            tagline={copy.professional.tagline}
            price={price(cents('professional'))}
            period={period(cents('professional'))}
            features={featuresFor('professional')}
            cta={contactSales ? sales : { label: copy.professional.cta, href: '/signup' }}
          />
          <Plan
            tier='enterprise'
            volume={volume}
            locale={locale}
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
