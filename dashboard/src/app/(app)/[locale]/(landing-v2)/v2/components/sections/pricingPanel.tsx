'use client';

import { useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { Currency, Tier } from '@/entities/billing/billing.entities';
import { usePlanFeatures, type PlanFeatureLabel } from '@/components/pricing/usePlanFeatures';
import { EVENT_RANGES, isContactSalesRange } from '@/lib/billing/plans';
import { formatEventCount, formatPrice } from '@/utils/pricing';
import { cn } from '@/lib/utils';
import { Panel } from '@/app/(app)/[locale]/(landing-v2)/v2/components/ui/frame';
import { COPY } from '@/app/(app)/[locale]/(landing-v2)/v2/content/copy';

const copy = COPY.pricing;
const CURRENCIES: readonly Currency[] = ['USD', 'EUR'];

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
  price: string;
  period?: string;
  badge?: string;
  features: PlanFeatureLabel[];
  cta: { label: string; href: '/signup' | '/contact' };
  pick?: boolean;
};

function Plan({ name, tagline, price, period, badge, features, cta, pick }: PlanProps) {
  return (
    <div className={cn('plan', pick && 'plan--pick')}>
      <div className='plan__hd'>
        <span className='plan__name'>{name}</span>
        {badge ? <span className='plan__badge'>{badge}</span> : null}
      </div>
      <div className='plan__pr'>
        <b>{price}</b>
        {period ? <em>{period}</em> : null}
      </div>
      <p className='plan__sub'>{tagline}</p>
      <ul>
        {features.map((f) => (
          <li key={f.label} className={cn(f.kind === 'header' && 'is-head')}>
            <Check />
            {f.label}
          </li>
        ))}
      </ul>
      <Link className={cn('btn', pick ? 'btn--volt' : 'btn--line')} href={cta.href}>
        {cta.label}
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
  const locale = useLocale();
  const [rangeIndex, setRangeIndex] = useState(0);
  const [currency, setCurrency] = useState<Currency>('USD');

  const range = EVENT_RANGES[rangeIndex];
  const lastIndex = EVENT_RANGES.length - 1;
  const contactSales = isContactSalesRange(range);
  const featuresFor = usePlanFeatures(range);

  const cents = (tier: 'growth' | 'professional') =>
    currency === 'EUR' ? range[tier].price.eur_cents : range[tier].price.usd_cents;
  const price = (c: number) =>
    contactSales ? copy.custom : c === 0 ? copy.free : formatPrice(c, currency, locale);
  const period = (c: number) => (contactSales || c === 0 ? undefined : copy.perMonth);
  const sales = { label: copy.enterprise.cta, href: '/contact' } as const;
  const growthCents = cents('growth');

  return (
    <>
      <div className='range'>
        <div className='range__val'>
          <b>{formatEventCount(range.value, locale)}</b>
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
        <div className='range__ticks' aria-hidden>
          <span>{formatEventCount(EVENT_RANGES[0].value, locale)}</span>
          <span>{formatEventCount(EVENT_RANGES[lastIndex].value, locale)}</span>
        </div>
        <div className='tabs' role='group' aria-label={copy.currencyLabel}>
          {CURRENCIES.map((c) => (
            <button key={c} type='button' aria-pressed={currency === c} onClick={() => setCurrency(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <Panel>
        <div className='plans'>
          <Plan
            tier='growth'
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
