'use client';

import { Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { SelectedPlan } from '@/types/pricing';
import type { UserBillingData, Currency } from '@/entities/billing/billing.entities';
import { getPlan, isCurrentOffer } from '@/lib/billing/catalog';
import { Dispatch, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import NumberFlow from '@number-flow/react';
import { EventCountText, FLUSH, QUICK_ROLL } from './EventCountFlow';
import { usePlanCards, usePlanFeatures, type PlanCard } from './usePlanFeatures';
import { promoCents, type Promo } from '@/lib/billing/promo';

interface PricingCardsProps {
  promo: Promo | null;
  volume: number;
  currency: Currency;
  onPlanSelect: Dispatch<SelectedPlan>;
  billingData: UserBillingData;
}

type BillingPlanCard = PlanCard & { description: string; isCurrent: boolean };

export function PricingCards({ promo, volume, currency, onPlanSelect, billingData }: PricingCardsProps) {
  const t = useTranslations('pricingCards');
  const tPromo = useTranslations('promo');
  const featuresFor = usePlanFeatures();
  const planCards = usePlanCards(volume, currency);

  const cards: BillingPlanCard[] = useMemo(() => {
    const { subscription } = billingData;
    return planCards.map((card) => {
      const isCurrent = isCurrentOffer(subscription, card.plan, card.offer, currency);
      return {
        ...card,
        description: t(`descriptions.${card.plan.id}`),
        // an older free plan has larger limits than Free, so its card lists what the account really has
        features: isCurrent ? featuresFor(getPlan(subscription.planId)) : card.features,
        isCurrent,
      };
    });
  }, [planCards, billingData, currency, featuresFor, t]);

  const renderButton = ({ plan, offer, isRecommended, isCurrent }: BillingPlanCard) => {
    const variant = isRecommended ? 'default' : 'outline';
    if (offer.kind === 'quoted') {
      return (
        <Link href='/contact' className='w-full' target='_blank' rel='noopener noreferrer'>
          <Button size='lg' className='w-full cursor-pointer' variant={variant}>
            {t('cta.contactUs')}
          </Button>
        </Link>
      );
    }
    if (isCurrent) {
      return (
        <Button size='lg' className='w-full' variant='secondary' disabled>
          {t('cta.currentPlan')}
        </Button>
      );
    }
    const label =
      offer.kind === 'free'
        ? t('cta.getStartedForFree')
        : billingData.isExistingPaidSubscriber
          ? t('cta.changeToThisPlan')
          : t('cta.getStarted');
    return (
      <Button
        size='lg'
        className='w-full cursor-pointer'
        variant={variant}
        onClick={() => onPlanSelect({ planId: plan.id, eventLimit: offer.events, currency })}
        disabled={offer.kind === 'free'}
      >
        {label}
      </Button>
    );
  };

  return (
    <div className='bg-card grid overflow-hidden rounded-2xl border md:grid-cols-2 xl:grid-cols-4'>
      {cards.map((card) => {
        const { plan, offer } = card;
        const promoPrice = promo && offer.kind === 'paid' ? promoCents(offer.cents, promo) : undefined;
        const listLabel =
          offer.kind === 'paid'
            ? new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(
                offer.cents / 100,
              )
            : null;
        return (
          <div
            key={plan.id}
            data-slot='plan-card'
            // five rows shared with the other plans, so prices and buttons stay level when a description wraps
            className={cn(
              'relative row-span-5 grid grid-rows-subgrid p-7',
              'max-md:not-first:border-t md:max-xl:even:border-l md:max-xl:nth-[n+3]:border-t xl:not-first:border-l',
              card.isRecommended && 'bg-primary/5 shadow-[inset_0_2px_0_var(--color-primary)]',
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
              {/* reserved on every card so prices stay level */}
              {promo && (
                <p className='text-muted-foreground h-5 text-sm leading-5 tabular-nums'>
                  {promoPrice !== undefined && listLabel && (
                    <>
                      <s>{listLabel}</s>
                      <span className='bg-primary/15 text-primary dark:bg-primary/35 dark:text-primary-foreground ml-2 inline-block rounded px-1.5 align-[1px] text-xs leading-[18px] font-medium'>
                        {tPromo('tag', { percent: promo.percentOff })}
                      </span>
                    </>
                  )}
                </p>
              )}
              <div className='flex h-11 items-baseline gap-1.5'>
                <b className='text-[2.5rem] leading-11 font-medium tracking-[-0.035em] tabular-nums'>
                  {offer.kind === 'quoted' ? (
                    t('labels.custom')
                  ) : (
                    <NumberFlow
                      // tabular figures give the decimal point a digit's width
                      className={cn(FLUSH, '[&::part(decimal)]:[font-variant-numeric:proportional-nums]')}
                      value={(promoPrice ?? (offer.kind === 'paid' ? offer.cents : 0)) / 100}
                      locales='en-US'
                      format={{
                        style: 'currency',
                        currency,
                        maximumFractionDigits: promoPrice !== undefined ? 2 : 0,
                      }}
                      willChange
                      {...QUICK_ROLL}
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
              {promoPrice !== undefined && promo && listLabel && (
                <p className='text-muted-foreground mt-1 text-sm'>
                  {tPromo('then', { months: promo.months, price: listLabel })}
                </p>
              )}
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
