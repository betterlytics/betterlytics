import type { ReactNode } from 'react';
import { ArrowRight, Check, Minus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { PLAN_CAPABILITIES } from '@/lib/billing/capabilities';
import { EVENT_RANGES, type TierName } from '@/lib/billing/plans';
import { AppLink } from '@/landing/components/ui/appLink';
import { cn } from '@/landing/lib/cn';

const TIERS: TierName[] = ['growth', 'professional', 'enterprise'];
/** Capabilities at or above this read as unlimited (enterprise is stored as 9999). */
const UNLIMITED = 9999;
const ROWS = ['monitors', 'interval', 'advanced', 'statusPages', 'customDomain'] as const;

export function PlansTable() {
  const t = useTranslations('landing.uptime.plans');
  const tPricing = useTranslations('landing.pricing');
  const yes = (
    <>
      <Check className='size-4 text-volt-soft' strokeWidth={2.4} aria-hidden />
      <span className='sr-only'>{t('included')}</span>
    </>
  );
  const no = (
    <>
      <Minus className='size-4 text-muted opacity-50' aria-hidden />
      <span className='sr-only'>{t('notIncluded')}</span>
    </>
  );
  const locale = useLocale();
  const price = new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
  const count = (n: number) => (n >= UNLIMITED ? t('unlimited') : String(n));

  const head: Record<TierName, string> = {
    growth: t('free'),
    professional: t('from', { price: price.format(EVENT_RANGES[0].professional.price.usd_cents / 100) }),
    enterprise: t('custom'),
  };
  const cell = (tier: TierName, row: (typeof ROWS)[number]): ReactNode => {
    const { monitoring, statusPages } = PLAN_CAPABILITIES[tier];
    switch (row) {
      case 'monitors':
        return count(monitoring.maxMonitors);
      case 'interval':
        return t('minutes', { count: monitoring.minIntervalSeconds / 60 });
      case 'advanced':
        return monitoring.customHeaders && monitoring.customStatusCodes && monitoring.keywordValidation ? yes : no;
      case 'statusPages':
        return count(statusPages.maxStatusPages);
      case 'customDomain':
        return statusPages.customDomain ? yes : no;
    }
  };

  return (
    <div className='max-sm:-mx-(--pad)'>
      <div className='overflow-x-auto'>
        <table className='w-full min-w-[560px] border-collapse text-left max-sm:min-w-0'>
          <thead>
            <tr>
              <td className='w-[34%] border-r border-b border-rule-08 bg-hatch transition-ink' />
              {TIERS.map((tier) => (
                <th
                  key={tier}
                  scope='col'
                  className={cn(
                    'border-b border-rule-08 px-6 pt-6 pb-5 align-top font-normal transition-ink max-sm:px-2.5 max-sm:pt-5',
                    tier !== 'enterprise' && 'border-r',
                    tier === 'professional' && 'bg-volt/10',
                  )}
                >
                  <span className='block text-title leading-6 font-medium tracking-ui max-sm:text-label'>
                    {tPricing(`${tier}.name`)}
                  </span>
                  <span className='mt-1 block text-label text-muted max-sm:text-micro'>{head[tier]}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row}>
                <th
                  scope='row'
                  className='border-r border-b border-rule-08 bg-hatch px-6 py-4 text-label font-normal text-muted transition-ink max-sm:w-[31%] max-sm:pr-2 max-sm:pl-(--pad) max-sm:text-caption'
                >
                  {t(`rows.${row}`)}
                </th>
                {TIERS.map((tier) => (
                  <td
                    key={tier}
                    className={cn(
                      'border-b border-rule-08 px-6 py-4 text-body tabular-nums transition-ink max-sm:px-2.5 max-sm:text-label',
                      tier !== 'enterprise' && 'border-r',
                      tier === 'professional' && 'bg-volt/10',
                    )}
                  >
                    {cell(tier, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className='flex flex-wrap items-center justify-between gap-x-8 gap-y-3 px-6 py-5 max-sm:px-(--pad)'>
        <p className='max-w-[64ch] text-label leading-[21px] text-muted'>
          {t('perDashboard')} {t('selfHost')}
        </p>
        <AppLink
          href='/pricing'
          className='group inline-flex items-center gap-1.5 text-label whitespace-nowrap text-volt-text transition-colors duration-180 ease-out-expo hover:text-fg'
        >
          {t('compare')}
          <ArrowRight
            className='size-3.5 transition-transform duration-200 group-hover:translate-x-0.5'
            aria-hidden
          />
        </AppLink>
      </div>
    </div>
  );
}
