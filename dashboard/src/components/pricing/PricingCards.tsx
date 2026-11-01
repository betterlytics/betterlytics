'use client';

import { Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { SelectedPlan } from '@/types/pricing';
import type { UserBillingData, Currency } from '@/entities/billing/billing.entities';
import { isCustomVolume, isFreeBand, isQuoted, listedPlans, priceFor, type PlanId } from '@/lib/billing/catalog';
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

interface PlanConfig {
  id: PlanId;
  name: string;
  contactOnly: boolean;
  isFree: boolean;
  priceCents: number | null;
  period: string;
  description: string;
  features: readonly PlanFeatureLabel[];
  cta: string;
  popular: boolean;
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
  const isContactSales = isCustomVolume(volume);
  const featuresFor = usePlanFeatures(volume);

  const plans: PlanConfig[] = useMemo(
    () =>
      listedPlans().map((plan) => {
        const contactOnly = isQuoted(plan, volume);
        const isFree = isFreeBand(plan, volume);
        return {
          id: plan.id,
          name: plan.name,
          contactOnly,
          isFree,
          priceCents: contactOnly ? null : priceFor(plan, volume, currency),
          period: contactOnly || isFree ? '' : t('periodPerMonth'),
          description: t(`descriptions.${plan.id}`),
          features: featuresFor(plan),
          cta: !plan.selfServe
            ? t('cta.contactUs')
            : isContactSales
              ? t('cta.contactSales')
              : isFree
                ? t('cta.getStartedForFree')
                : t('cta.getStarted'),
          popular: plan.featured,
        };
      }),
    [volume, currency, isContactSales, featuresFor, t],
  );

  const handlePlanClick = (plan: PlanConfig) => {
    if (mode === 'billing' && onPlanSelect) {
      const selectedPlan: SelectedPlan = {
        planId: plan.id,
        eventLimit: volume,
        currency,
      };
      onPlanSelect(selectedPlan);
    }
  };

  const renderButton = (plan: PlanConfig) => {
    if (plan.contactOnly) {
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

    if (mode === 'billing' && billingData) {
      const isCurrentPlan =
        billingData.subscription.planId === plan.id && billingData.subscription.eventLimit === volume;

      let buttonText = plan.cta;
      let buttonVariant: 'default' | 'outline' | 'secondary' = plan.popular ? 'default' : 'outline';
      let isDisabled = false;

      if (isCurrentPlan) {
        buttonText = t('cta.currentPlan');
        buttonVariant = 'secondary';
        isDisabled = true;
      } else if (plan.isFree) {
        buttonText = t('cta.getStartedForFree');
        isDisabled = true;
      } else if (billingData.isExistingPaidSubscriber) {
        buttonText = t('cta.changeToThisPlan');
      } else {
        buttonText = plan.cta;
      }

      return (
        <Button
          className='mt-auto w-full cursor-pointer'
          variant={buttonVariant}
          onClick={() => handlePlanClick(plan)}
          disabled={isDisabled}
        >
          {buttonText}
        </Button>
      );
    }

    const href = plan.cta.toLowerCase().includes(t('cta.getStarted').toLowerCase()) ? '/signup' : '/contact';

    return (
      <Link href={href} className='w-full'>
        <Button className='mt-auto w-full cursor-pointer' variant={plan.popular ? 'default' : 'outline'}>
          {plan.cta}
        </Button>
      </Link>
    );
  };

  return (
    <div className={`mx-auto grid max-w-6xl gap-8 md:grid-cols-3 ${className}`}>
      {plans.map((plan) => (
        <Card
          key={plan.id}
          data-popular={plan.popular}
          className={cn(
            'group border-border/70 bg-card/80 hover:bg-card/90 focus-within:ring-offset-background relative flex h-full flex-col rounded-2xl border shadow-sm transition duration-300 ease-out focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:-translate-y-1 hover:border-blue-400/40 hover:shadow-xl hover:shadow-blue-500/10 motion-reduce:transform-none motion-reduce:transition-none',
            plan.popular
              ? 'bg-gradient-to-b from-blue-600/10 via-blue-600/5 to-transparent shadow-2xl ring-2 shadow-blue-600/20 ring-blue-500/70'
              : '',
          )}
        >
          {plan.popular && (
            <Badge className='absolute -top-3 left-1/2 -translate-x-1/2 transform rounded-full border-transparent bg-blue-600 px-3 py-1 text-white shadow-sm shadow-blue-600/30'>
              {t('badges.mostPopular')}
            </Badge>
          )}
          {billingData &&
            billingData.subscription.planId === plan.id &&
            billingData.subscription.eventLimit === volume && (
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
              {!plan.isFree && plan.priceCents !== null ? (
                <NumberFlow
                  className='-translate-y-[0.2em] text-4xl leading-10 font-bold tabular-nums'
                  value={plan.priceCents / 100}
                  locales={'en-US'}
                  format={{ style: 'currency', currency, maximumFractionDigits: 0 }}
                  willChange
                />
              ) : (
                <span className='text-4xl leading-10 font-bold'>
                  {plan.isFree ? t('labels.free') : t('labels.custom')}
                </span>
              )}
              {plan.period && (
                <span className='text-muted-foreground -translate-y-[0.4em] text-lg'>{plan.period}</span>
              )}
            </div>
            <CardDescription className='mt-2 min-h-10'>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-grow flex-col'>
            <ul className='mb-6 flex-grow space-y-3'>
              {plan.features.map((feature) => (
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
            {renderButton(plan)}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
