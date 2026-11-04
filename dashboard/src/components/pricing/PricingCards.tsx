'use client';

import { Check } from 'lucide-react';
import { Card } from '@/components/ui/card';
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
import { useOfferVolumeLabel, usePlanFeatures, type PlanFeatureLabel } from './usePlanFeatures';

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
  volumeLabel: string;
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
          <Button className='w-full cursor-pointer' variant={isRecommended ? 'default' : 'outline'}>
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
          <Button className='w-full' variant='secondary' disabled>
            {t('cta.currentPlan')}
          </Button>
        );
      }
      return (
        <Button
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
        <Button className='w-full cursor-pointer' variant={variant}>
          {startLabel}
        </Button>
      </Link>
    );
  };

  return (
    <div className={cn('grid gap-6 md:grid-cols-2 xl:grid-cols-4', className)}>
      {cards.map((card) => {
        const { plan, offer } = card;
        return (
          <Card
            key={plan.id}
            // shares six rows with the other cards, so prices and buttons stay level when a description wraps
            className={cn(
              'row-span-6 grid grid-rows-subgrid gap-0 rounded-2xl p-6 transition-opacity duration-200',
              card.isRecommended
                ? 'border-blue-500/70 bg-gradient-to-b from-blue-600/10 via-blue-600/5 to-transparent ring-1 ring-blue-500/40'
                : 'border-border/70 bg-card/80',
              !card.fits && 'opacity-50 focus-within:opacity-100 hover:opacity-100',
            )}
          >
            <div className='flex flex-wrap items-center gap-2'>
              <h3 className='text-xl font-semibold'>{plan.name}</h3>
              {card.isRecommended && (
                <Badge className='rounded-full border-transparent bg-blue-600 text-white'>
                  {t('badges.mostPopular')}
                </Badge>
              )}
              {card.isCurrent && (
                <Badge variant='secondary' className='rounded-full'>
                  {t('badges.current')}
                </Badge>
              )}
            </div>
            <p className='text-muted-foreground mt-2 text-sm'>{card.description}</p>
            <div className='mt-6 flex h-10 items-baseline gap-1'>
              {offer.kind === 'quoted' ? (
                <span className='text-4xl leading-10 font-bold tracking-tight'>{t('labels.custom')}</span>
              ) : (
                <>
                  <NumberFlow
                    className='-translate-y-[0.2em] text-4xl leading-10 font-bold tracking-tight tabular-nums'
                    value={offer.kind === 'paid' ? offer.cents / 100 : 0}
                    locales='en-US'
                    format={{ style: 'currency', currency, maximumFractionDigits: 0 }}
                    willChange
                  />
                  <span className='text-muted-foreground text-base'>{t('periodPerMonth')}</span>
                </>
              )}
            </div>
            <p className='text-muted-foreground mt-1 text-sm'>{card.volumeLabel}</p>
            <div className='mt-6'>{renderButton(card)}</div>
            <ul className='border-border/70 mt-6 space-y-3 border-t pt-6'>
              {card.features.map((feature) => (
                <li key={feature.label} className='flex items-start gap-3'>
                  <Check className='mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500' />
                  <span
                    className={cn(
                      'text-sm',
                      feature.kind === 'header' ? 'text-foreground font-semibold' : 'text-foreground/90',
                    )}
                  >
                    {feature.label}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        );
      })}
    </div>
  );
}
