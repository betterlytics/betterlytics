'use client';

import { Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { SelectedPlan } from '@/types/pricing';
import type { UserBillingData, Currency } from '@/entities/billing/billing.entities';
import {
  getPlan,
  isFreePlan,
  listedPlans,
  offerFor,
  type PlanDefinition,
  type PlanOffer,
} from '@/lib/billing/catalog';
import { Dispatch, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import NumberFlow from '@number-flow/react';
import { usePlanFeatures, type PlanFeatureLabel } from './usePlanFeatures';

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
  features: readonly PlanFeatureLabel[];
  isCurrent: boolean;
}

/** Free plans are interchangeable here: a grandfathered free account is "current" on the Free card. */
function isCurrentPlan(subscription: UserBillingData['subscription'], plan: PlanDefinition, events: number) {
  if (isFreePlan(plan)) return isFreePlan(getPlan(subscription.planId));
  return subscription.planId === plan.id && subscription.eventLimit === events;
}

export function PricingCards({
  volume,
  currency,
  onPlanSelect,
  mode = 'landing',
  className = '',
  billingData,
}: PricingCardsProps) {
  const t = useTranslations('pricingCards');
  const featuresFor = usePlanFeatures();

  const cards: PlanCard[] = useMemo(
    () =>
      listedPlans().map((plan) => {
        const offer = offerFor(plan, volume, currency);
        return {
          plan,
          offer,
          description: t(`descriptions.${plan.id}`),
          features: featuresFor(plan, offer.events),
          isCurrent: billingData ? isCurrentPlan(billingData.subscription, plan, offer.events) : false,
        };
      }),
    [volume, currency, billingData, featuresFor, t],
  );

  const renderButton = ({ plan, offer, isCurrent }: PlanCard) => {
    if (offer.kind === 'quoted') {
      return (
        <Link
          href='/contact'
          className='w-full'
          target={mode === 'billing' ? '_blank' : undefined}
          rel={mode === 'billing' ? 'noopener noreferrer' : undefined}
        >
          <Button className='mt-auto w-full cursor-pointer' variant='outline'>
            {t('cta.contactUs')}
          </Button>
        </Link>
      );
    }

    const startLabel = offer.kind === 'free' ? t('cta.getStartedForFree') : t('cta.getStarted');

    if (mode === 'billing' && billingData) {
      let buttonText = startLabel;
      let buttonVariant: 'default' | 'outline' | 'secondary' = plan.featured ? 'default' : 'outline';
      let isDisabled = false;

      if (isCurrent) {
        buttonText = t('cta.currentPlan');
        buttonVariant = 'secondary';
        isDisabled = true;
      } else if (offer.kind === 'free') {
        isDisabled = true;
      } else if (billingData.isExistingPaidSubscriber) {
        buttonText = t('cta.changeToThisPlan');
      }

      return (
        <Button
          className='mt-auto w-full cursor-pointer'
          variant={buttonVariant}
          onClick={() => onPlanSelect?.({ planId: plan.id, eventLimit: offer.events, currency })}
          disabled={isDisabled}
        >
          {buttonText}
        </Button>
      );
    }

    return (
      <Link href='/signup' className='w-full'>
        <Button className='mt-auto w-full cursor-pointer' variant={plan.featured ? 'default' : 'outline'}>
          {startLabel}
        </Button>
      </Link>
    );
  };

  return (
    <div className={`mx-auto grid max-w-6xl gap-6 md:grid-cols-2 xl:grid-cols-4 ${className}`}>
      {cards.map((card) => {
        const { plan, offer } = card;
        return (
          <Card
            key={plan.id}
            data-popular={plan.featured}
            className={cn(
              'group border-border/70 bg-card/80 hover:bg-card/90 focus-within:ring-offset-background relative flex h-full flex-col rounded-2xl border shadow-sm transition duration-300 ease-out focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:-translate-y-1 hover:border-blue-400/40 hover:shadow-xl hover:shadow-blue-500/10 motion-reduce:transform-none motion-reduce:transition-none',
              plan.featured
                ? 'bg-gradient-to-b from-blue-600/10 via-blue-600/5 to-transparent shadow-2xl ring-2 shadow-blue-600/20 ring-blue-500/70'
                : '',
            )}
          >
            {plan.featured && (
              <Badge className='absolute -top-3 left-1/2 -translate-x-1/2 transform rounded-full border-transparent bg-blue-600 px-3 py-1 text-white shadow-sm shadow-blue-600/30'>
                {t('badges.mostPopular')}
              </Badge>
            )}
            {card.isCurrent && (
              <Badge
                variant='secondary'
                className='absolute -bottom-3 left-1/2 -translate-x-1/2 transform rounded-full border-transparent'
              >
                {t('badges.current')}
              </Badge>
            )}
            <CardHeader className='text-center'>
              <CardTitle className='text-2xl'>{plan.name}</CardTitle>
              <div className='mt-4 flex h-12 items-baseline justify-center'>
                {offer.kind === 'paid' ? (
                  <>
                    <NumberFlow
                      className='-translate-y-[0.2em] text-4xl leading-10 font-bold tabular-nums'
                      value={offer.cents / 100}
                      locales={'en-US'}
                      format={{ style: 'currency', currency, maximumFractionDigits: 0 }}
                      willChange
                    />
                    <span className='text-muted-foreground -translate-y-[0.4em] text-lg'>
                      {t('periodPerMonth')}
                    </span>
                  </>
                ) : (
                  <span className='text-4xl leading-10 font-bold'>
                    {offer.kind === 'free' ? t('labels.free') : t('labels.custom')}
                  </span>
                )}
              </div>
              <CardDescription className='mt-2 min-h-10 xl:min-h-15'>{card.description}</CardDescription>
            </CardHeader>
            <CardContent className='flex flex-grow flex-col'>
              <ul className='mb-6 flex-grow space-y-3'>
                {card.features.map((feature) => (
                  <li key={feature.label} className='flex items-center'>
                    <Check className='mr-3 h-4 w-4 flex-shrink-0 text-blue-500' />
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
              {renderButton(card)}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
