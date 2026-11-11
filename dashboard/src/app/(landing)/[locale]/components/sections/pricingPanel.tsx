'use client';

import { useRef, useState } from 'react';
import * as Slider from '@radix-ui/react-slider';
import NumberFlow from '@number-flow/react';
import { useLocale, useTranslations } from 'next-intl';
import { EventCountFlow, EventCountText, FLUSH, QUICK_ROLL } from '@/components/pricing/EventCountFlow';
import { usePlanCards, type PlanFeatureLabel, type VolumeLabel } from '@/components/pricing/usePlanFeatures';
import { usePromo } from '@/components/pricing/usePromo';
import { VOLUME_STOPS, type PlanId } from '@/lib/billing/catalog';
import { promoCents } from '@/lib/billing/promo';
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
const PROMO_PRICE_FORMAT = { style: 'currency', currency: CURRENCY } as const;
// tabular figures give the decimal point a digit's width
const NARROW_DECIMAL = '[&::part(decimal)]:[font-variant-numeric:proportional-nums]';

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
  /** Reserves the struck-through price line on every plan, so prices stay level during a promo. */
  promoRow?: boolean;
  /** Cents before a promo discount, shown struck through. */
  listPrice?: number;
  promoNote?: string;
  period?: string;
  volumeLabel: VolumeLabel;
  badge?: string;
  features: PlanFeatureLabel[];
  cta: PlanCta;
  pick?: boolean;
  dimmed?: boolean;
};

function Plan({
  tier,
  name,
  tagline,
  price,
  promoRow,
  listPrice,
  promoNote,
  period,
  volumeLabel,
  badge,
  features,
  cta,
  pick,
  dimmed,
}: PlanProps) {
  const locale = useLocale();
  return (
    // a subgrid of five rows shared across plans, so prices and buttons stay level when a tagline wraps
    <div
      data-dimmed={dimmed || undefined}
      className={cn(
        styles.plan,
        'relative row-span-5 grid grid-rows-subgrid border-rule-10 p-9 transition-ink',
        '3xl:not-first:border-l',
        'md:max-3xl:even:border-l md:max-3xl:nth-[n+3]:border-t',
        'max-md:py-7 max-md:not-first:border-t max-sm:px-(--pad)',
        pick && 'bg-volt/10 shadow-[inset_0_2px_0_var(--color-volt-lift)]',
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
      <p className='mb-4 text-body-sm leading-[22px] text-muted'>{tagline}</p>
      <div className={cn('mb-2.5', promoRow && '@container')}>
        {promoRow ? (
          <p className='h-6 text-[18px] leading-6 tracking-[-0.3px] text-muted tabular-nums'>
            {listPrice !== undefined ? (
              <s>{new Intl.NumberFormat(locale, PRICE_FORMAT).format(listPrice / 100)}</s>
            ) : null}
          </p>
        ) : null}
        {/* fixed height so swapping a figure for a word doesn't shift the plans */}
        <div className='flex h-11 items-baseline gap-1.5'>
          <b
            className={cn(
              'leading-11 font-medium tracking-[-1.5px] tabular-nums',
              // promo prices carry cents, so narrow four-column cards scale them down to keep the period beside them
              promoRow ? 'text-[length:min(42px,18cqi)]' : 'text-[42px]',
            )}
          >
            {typeof price === 'number' ? (
              <NumberFlow
                className={cn(FLUSH, NARROW_DECIMAL)}
                value={price / 100}
                locales={locale}
                format={listPrice !== undefined ? PROMO_PRICE_FORMAT : PRICE_FORMAT}
                willChange
                {...QUICK_ROLL}
              />
            ) : (
              price
            )}
          </b>
          {period ? <span className='text-body-sm tracking-ui text-muted'>{period}</span> : null}
        </div>
        <p className='mt-1.5 text-body-sm tracking-ui text-muted'>
          <EventCountText {...volumeLabel} />
        </p>
        {promoNote ? <p className='mt-1 text-body-sm tracking-ui text-volt-soft'>{promoNote}</p> : null}
      </div>
      <div>
        <ul className='mt-3 mb-[26px] border-t border-rule-08 pt-[22px] transition-ink'>
          {features.map((f) => (
            <li
              key={f.label}
              className={cn(
                'flex items-start gap-[11px] py-[7px] text-body-sm leading-[21px] tracking-ui text-fg opacity-84',
                f.kind === 'header' && 'pb-[11px] font-semibold opacity-100',
              )}
            >
              <Check />
              <span>{f.label}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <TrackedLink
          className={buttonStyles({ variant: pick ? 'volt' : 'line', className: 'group w-full p-[13px]' })}
          href={`/${cta.destination}`}
          placement='pricing'
          destination={cta.destination}
          plan={tier}
        >
          <RollLabel text={cta.label} />
        </TrackedLink>
      </div>
    </div>
  );
}

export function PricingPanel() {
  const t = useTranslations('landing.pricing');
  const tPromo = useTranslations('promo');
  const locale = useLocale();
  const promo = usePromo();
  const promoNote = promo ? tPromo('offer', { percent: promo.percentOff, months: promo.months }) : undefined;
  const [rangeIndex, setRangeIndex] = useState(0);
  const sliderRef = useRef<HTMLSpanElement>(null);
  // drives the phone thumb nudge in the module
  const sliderSeen = useInView(sliderRef, 'read');

  const events = VOLUME_STOPS[rangeIndex];
  const lastIndex = VOLUME_STOPS.length - 1;
  const cards = usePlanCards(events, CURRENCY);

  const sales: PlanCta = { label: t('contactCta'), destination: 'contact' };

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

      <Panel flush>
        <div className='grid max-sm:-mx-(--pad) md:grid-cols-2 3xl:grid-cols-4'>
          {cards.map(({ plan, offer, fits, isRecommended, volumeLabel, features }) => {
            const listCents = offer.kind === 'paid' ? offer.cents : undefined;
            const promoPrice = promo && listCents !== undefined ? promoCents(listCents, promo) : undefined;
            return (
              <Plan
                key={plan.id}
                tier={plan.id}
                pick={isRecommended}
                dimmed={!fits}
                name={plan.name}
                badge={isRecommended ? t('badge') : undefined}
                tagline={t(`plans.${plan.id}.tagline`)}
                price={promoPrice ?? listCents ?? (offer.kind === 'free' ? 0 : t('custom'))}
                promoRow={promo !== null}
                listPrice={promoPrice !== undefined ? listCents : undefined}
                promoNote={promoPrice !== undefined ? promoNote : undefined}
                period={offer.kind === 'quoted' ? undefined : t('perMonth')}
                volumeLabel={volumeLabel}
                features={features}
                cta={
                  offer.kind === 'quoted'
                    ? sales
                    : { label: offer.kind === 'free' ? t('ctaFree') : t('cta'), destination: 'signup' }
                }
              />
            );
          })}
        </div>
      </Panel>
    </>
  );
}
