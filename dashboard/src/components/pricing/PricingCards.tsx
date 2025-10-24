'use client';

import { Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { SelectedPlan } from '@/types/pricing';
import type { UserBillingData, Tier, Currency } from '@/entities/billing';
import { formatPrice } from '@/utils/pricing';
import { capitalizeFirstLetter } from '@/utils/formatters';
import { EventRange } from '@/lib/billing/plans';
import { Dispatch } from 'react';
import { useTranslations } from 'next-intl';

interface PricingCardsProps {
  eventRange: EventRange;
  currency: Currency;
  onPlanSelect?: Dispatch<SelectedPlan>;
  mode?: 'landing' | 'billing';
  className?: string;
  billingData?: UserBillingData;
}

interface PlanConfig {
  tier: Tier;
  price_cents: number;
  period: string;
  description: string;
  features: readonly string[];
  cta: string;
  popular: boolean;
  lookup_key: string | null;
}

export function PricingCards({
  eventRange,
  currency,
  onPlanSelect,
  mode = 'landing',
  className = '',
  billingData,
}: PricingCardsProps) {
  const t = useTranslations('pricingCards');
  const growthPrice = currency === 'EUR' ? eventRange.growth.price.eur_cents : eventRange.growth.price.usd_cents;
  const professionalPrice =
    currency === 'EUR' ? eventRange.professional.price.eur_cents : eventRange.professional.price.usd_cents;

  const isFree = growthPrice === 0;
  const isCustom = growthPrice < 0;

  const plans: PlanConfig[] = [
    {
      tier: 'growth',
      price_cents: growthPrice,
      period: !isFree && !isCustom ? t('periodPerMonth') : '',
      description: t('descriptions.growth'),
      features: [
        t('features.upToEventsPerMonth', { events: eventRange.label }),
        t('features.allFeatures'),
        t('features.oneSite'),
        t('features.retention1PlusYear'),
        t('features.emailSupport'),
      ],
      cta: isFree ? t('cta.getStartedForFree') : isCustom ? t('cta.contactSales') : t('cta.getStarted'),
      popular: false,
      lookup_key: eventRange.growth.lookup_key,
    },
    {
      tier: 'professional',
      price_cents: professionalPrice,
      period: !isCustom ? t('periodPerMonth') : '',
      description: t('descriptions.professional'),
      features: [
        t('features.upToEventsPerMonth', { events: eventRange.label }),
        t('features.everythingInStarter'),
        t('features.upTo50Sites'),
        t('features.retention3PlusYears'),
        //'Access to API',
        //'Up to 10 team members',
        t('features.prioritySupport'),
      ],
      cta: isCustom ? t('cta.contactSales') : t('cta.getStarted'),
      popular: true,
      lookup_key: eventRange.professional.lookup_key,
    },
    {
      tier: 'enterprise',
      price_cents: -1,
      period: '',
      description: t('descriptions.enterprise'),
      features: [
        t('features.everythingInProfessional'),
        t('features.unlimitedSites'),
        t('features.retention5PlusYears'),
        //'Unlimited team members',
        t('features.dedicatedSupport'),
        t('features.slaGuarantee'),
      ],
      cta: t('cta.contactUs'),
      popular: false,
      lookup_key: null,
    },
  ];

  const handlePlanClick = (plan: PlanConfig) => {
    if (mode === 'billing' && onPlanSelect) {
      const selectedPlan: SelectedPlan = {
        tier: plan.tier,
        eventLimit: eventRange.value,
        price_cents: plan.price_cents,
        period: plan.period,
        currency,
        lookup_key: plan.lookup_key,
      };
      onPlanSelect(selectedPlan);
    }
  };

  const formatDisplayPrice = (price: number): string => {
    if (price === 0) return t('labels.free');
    if (price < 0) return t('labels.custom');
    return formatPrice(price, currency);
  };

  const renderButton = (plan: PlanConfig) => {
    if (mode === 'billing' && billingData) {
      const isCurrentPlan =
        billingData.subscription.tier === plan.tier && billingData.subscription.eventLimit === eventRange.value;

      let buttonText = plan.cta;
      let buttonVariant: 'default' | 'outline' | 'secondary' = plan.popular ? 'default' : 'outline';
      let isDisabled = false;

      if (isCurrentPlan) {
        buttonText = t('cta.currentPlan');
        buttonVariant = 'secondary';
        isDisabled = true;
      } else if (plan.tier === 'enterprise') {
        buttonText = t('cta.contactSales');
      } else if (plan.tier === 'growth' && plan.price_cents === 0) {
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

    const href = plan.cta.toLowerCase().includes(t('cta.getStarted').toLowerCase()) ? '/register' : '/contact';

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
          key={plan.tier}
          className={`dark:metric-card relative flex flex-col ${plan.popular ? 'dark:shadow-card-glow border-primary/50' : ''}`}
        >
          {plan.popular && (
            <Badge className='bg-primary absolute -top-3 left-1/2 -translate-x-1/2 transform'>
              {t('badges.mostPopular')}
            </Badge>
          )}
          {billingData &&
            billingData.subscription.tier === plan.tier &&
            billingData.subscription.eventLimit === eventRange.value && (
              <Badge variant='secondary' className='absolute -bottom-3 left-1/2 -translate-x-1/2 transform'>
                {t('badges.current')}
              </Badge>
            )}
          <CardHeader className='text-center'>
            <CardTitle className='text-2xl'>{capitalizeFirstLetter(plan.tier)}</CardTitle>
            <div className='mt-4'>
              <span className='text-4xl font-bold'>{formatDisplayPrice(plan.price_cents)}</span>
              {plan.period && <span className='text-muted-foreground text-lg'>{plan.period}</span>}
            </div>
            <CardDescription className='mt-2'>{plan.description}</CardDescription>
          </CardHeader>
          <CardContent className='flex flex-grow flex-col'>
            <ul className='mb-6 flex-grow space-y-3'>
              {plan.features.map((feature) => (
                <li key={feature} className='flex items-center'>
                  <Check className='text-primary mr-3 h-4 w-4 flex-shrink-0' />
                  <span className='text-sm'>{feature}</span>
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
