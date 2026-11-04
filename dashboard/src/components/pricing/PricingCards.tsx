'use client';

import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { SelectedPlan } from '@/types/pricing';
import type { UserBillingData, Currency } from '@/entities/billing/billing.entities';
import {
  fitsVolume,
  getPlan,
  isCurrentOffer,
  listedPlans,
  offerFor,
  recommendedPlanFor,
  type PlanDefinition,
  type PlanOffer,
} from '@/lib/billing/catalog';
import { Dispatch, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import NumberFlow from '@number-flow/react';
import { EventCountText } from './EventCountFlow';
import { useOfferVolumeLabel, usePlanFeatures, type PlanFeatureLabel, type VolumeLabel } from './usePlanFeatures';

/** Cancels NumberFlow's mask padding, so the price lays out like text and shares a baseline with the period. */
const FLUSH = '[--number-flow-mask-height:0.25em] -my-(--number-flow-mask-height)';

interface PricingCardsProps {
  volume: number;
  currency: Currency;
  onPlanSelect?: Dispatch<SelectedPlan>;
  mode?: 'landing' | 'billing';
  className?: string;
  billingData?: UserBillingData;
}

interface PlanCard {
  plan: PlanDefinition;
  offer: PlanOffer;
  description: string;
  volumeLabel: VolumeLabel;
  features: readonly PlanFeatureLabel[];
  fits: boolean;
  isRecommended: boolean;
  isCurrent: boolean;
}

export function PricingCards({
  volume,
  currency,
  onPlanSelect,
  mode = 'landing',
  className,
  billingData,
}: PricingCardsProps) {
  const t = useTranslations('pricingCards');
  const featuresFor = usePlanFeatures();
  const volumeLabelFor = useOfferVolumeLabel();

  const cards: PlanCard[] = useMemo(() => {
    const recommended = recommendedPlanFor(volume);
    const subscription = billingData?.subscription;
    return listedPlans().map((plan) => {
      const offer = offerFor(plan, volume, currency);
      const isCurrent = subscription ? isCurrentOffer(subscription, plan, offer, currency) : false;
      return {
        plan,
        offer,
        description: t(`descriptions.${plan.id}`),
        volumeLabel: volumeLabelFor(offer),
        // an older free plan has larger limits than Free, so its card lists what the account really has
        features: featuresFor(isCurrent && subscription ? getPlan(subscription.planId) : plan),
        fits: fitsVolume(plan, volume),
        isRecommended: plan.id === recommended?.id,
        isCurrent,
      };
    });
  }, [volume, currency, billingData, featuresFor, volumeLabelFor, t]);

  const renderButton = ({ plan, offer, isRecommended, isCurrent }: PlanCard) => {
    if (offer.kind === 'quoted') {
      return (
        <Link
          href='/contact'
          className='w-full'
          target={mode === 'billing' ? '_blank' : undefined}
          rel={mode === 'billing' ? 'noopener noreferrer' : undefined}
        >
          <Button size='lg' className='w-full cursor-pointer' variant={isRecommended ? 'default' : 'outline'}>
            {t('cta.contactUs')}
          </Button>
        </Link>
      );
    }

    const startLabel = offer.kind === 'free' ? t('cta.getStartedForFree') : t('cta.getStarted');
    const variant = isRecommended ? 'default' : 'outline';

    if (mode === 'billing' && billingData) {
      if (isCurrent) {
        return (
          <Button size='lg' className='w-full' variant='secondary' disabled>
            {t('cta.currentPlan')}
          </Button>
        );
      }
      return (
        <Button
          size='lg'
          className='w-full cursor-pointer'
          variant={variant}
          onClick={() => onPlanSelect?.({ planId: plan.id, eventLimit: offer.events, currency })}
          disabled={offer.kind === 'free'}
        >
          {billingData.isExistingPaidSubscriber && offer.kind === 'paid' ? t('cta.changeToThisPlan') : startLabel}
        </Button>
      );
    }

    return (
      <Link href='/signup' className='w-full'>
        <Button size='lg' className='w-full cursor-pointer' variant={variant}>
          {startLabel}
        </Button>
      </Link>
    );
  };

  return (
    <div
      className={cn('bg-card grid overflow-hidden rounded-2xl border md:grid-cols-2 xl:grid-cols-4', className)}
    >
      {cards.map((card) => {
        const { plan, offer } = card;
        return (
          <div
            key={plan.id}
            data-slot='plan-card'
            // five rows shared with the other plans, so prices and buttons stay level when a description wraps
            className={cn(
              'relative row-span-5 grid grid-rows-subgrid p-7',
              'max-md:not-first:border-t md:max-xl:even:border-l md:max-xl:nth-[n+3]:border-t xl:not-first:border-l',
              card.isRecommended && 'bg-primary/5 shadow-[inset_0_2px_0_var(--color-primary)]',
              // the rows fade rather than the plan, so the rules between plans stay crisp
              '[&>*]:transition-opacity [&>*]:duration-200',
              !card.fits && '[&:focus-within>*]:opacity-100 [&:hover>*]:opacity-100 [&>*]:opacity-50',
            )}
          >
            {card.isRecommended && (
              <span className='bg-primary text-primary-foreground absolute top-0.5 right-7 rounded-b-md px-2.5 pt-0.5 pb-1 text-[11px] font-medium'>
                {t('badges.mostPopular')}
              </span>
            )}
            <div className='flex items-center gap-2'>
              <h3 className='text-lg font-semibold tracking-tight'>{plan.name}</h3>
              {card.isCurrent && (
                <Badge variant='secondary' className='rounded-full'>
                  {t('badges.current')}
                </Badge>
              )}
            </div>
            <p className='text-muted-foreground mt-1.5 text-sm leading-relaxed text-pretty'>{card.description}</p>
            <div className='mt-6'>
              <div className='flex h-11 items-baseline gap-1.5'>
                <b className='text-[2.5rem] leading-11 font-medium tracking-[-0.035em] tabular-nums'>
                  {offer.kind === 'quoted' ? (
                    t('labels.custom')
                  ) : (
                    <NumberFlow
                      className={FLUSH}
                      value={offer.kind === 'paid' ? offer.cents / 100 : 0}
                      locales='en-US'
                      format={{ style: 'currency', currency, maximumFractionDigits: 0 }}
                      willChange
                    />
                  )}
                </b>
                {offer.kind !== 'quoted' && (
                  <span className='text-muted-foreground text-sm'>{t('periodPerMonth')}</span>
                )}
              </div>
              <p className='text-foreground/80 mt-2.5 text-sm'>
                <EventCountText {...card.volumeLabel} />
              </p>
            </div>
            <div className='mt-6'>{renderButton(card)}</div>
            <ul className='mt-7 space-y-3 border-t pt-7'>
              {card.features.map((feature) => (
                <li key={feature.label} className='flex items-start gap-2.5 text-sm'>
                  <Check className='text-primary mt-0.5 size-4 shrink-0' />
                  <span
                    className={feature.kind === 'header' ? 'text-foreground font-medium' : 'text-foreground/80'}
                  >
                    {feature.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
