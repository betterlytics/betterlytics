'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/utils/dateFormatters';
import { formatNumber, formatPercentage } from '@/utils/formatters';

const MOCK_CAMPAIGNS = [
  { name: 'summer_sale_2024', visitors: 3847, bounceRate: 32, durationSeconds: 134 },
  { name: 'product_launch', visitors: 2156, bounceRate: 28, durationSeconds: 185 },
  { name: 'newsletter_promo', visitors: 1423, bounceRate: 41, durationSeconds: 108 },
];

function SkeletonCampaignRow({
  campaign,
  isMain = false,
}: {
  campaign: (typeof MOCK_CAMPAIGNS)[0];
  isMain?: boolean;
}) {
  const t = useTranslations('components.campaign.campaignRow');
  const locale = useLocale();

  return (
    <Card
      className={cn(
        'relative overflow-hidden px-4 py-3',
        isMain
          ? 'border-border/50 bg-card shadow-chart-1/5 ring-chart-1/10 shadow-lg ring-1'
          : 'border-border/30 bg-card/80',
      )}
    >
      <div
        className={cn(
          'absolute top-0 left-0 h-full w-1 rounded-l-lg bg-gradient-to-b',
          isMain ? 'from-chart-1 to-chart-1/50' : 'from-chart-1/50 to-chart-1/20',
        )}
        aria-hidden
      />

      <div className='flex items-center gap-4'>
        <div className='flex min-w-0 flex-1 items-center gap-3'>
          <div className='min-w-0 flex-1'>
            <div className={cn('truncate text-sm font-medium', isMain ? 'text-foreground' : 'text-foreground/50')}>
              {campaign.name}
            </div>
            <div className='text-muted-foreground/50 text-xs'>
              {t('visitors', { count: campaign.visitors })}
            </div>
          </div>
        </div>

        <div className='hidden items-center gap-6 sm:flex'>
          <div className='text-center'>
            <div className='text-muted-foreground/40 text-[10px] font-medium tracking-wider uppercase'>
              {t('bounceRate')}
            </div>
            <div
              className={cn(
                'text-sm font-semibold tabular-nums',
                isMain ? 'text-foreground/70' : 'text-foreground/40',
              )}
            >
              {formatPercentage(campaign.bounceRate, locale, { minimumFractionDigits: 0 })}
            </div>
          </div>

          <div className='text-center'>
            <div className='text-muted-foreground/40 text-[10px] font-medium tracking-wider uppercase'>
              {t('avgSessionDuration')}
            </div>
            <div
              className={cn(
                'text-sm font-semibold tabular-nums',
                isMain ? 'text-foreground/70' : 'text-foreground/40',
              )}
            >
              {formatDuration(campaign.durationSeconds, locale)}
            </div>
          </div>

          <div className='w-24 lg:w-32'>
            <div
              className={cn(
                'flex h-8 items-end gap-[2px] rounded-md border p-1.5',
                isMain ? 'border-border/30 bg-muted/30' : 'border-border/20 bg-background/10',
              )}
            >
              {[40, 65, 45, 80, 55, 70, 60, 75].map((height, i) => (
                <span
                  key={i}
                  className={cn(
                    'flex-1 rounded-sm bg-gradient-to-t',
                    isMain ? 'from-chart-1 to-chart-1/60' : 'from-chart-1/40 to-chart-1/20',
                  )}
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}

function FannedCampaignPreview() {
  return (
    <div className='relative w-full space-y-[-30px]'>
      <div className='opacity-35' style={{ transform: 'scale(0.94)' }}>
        <SkeletonCampaignRow campaign={MOCK_CAMPAIGNS[2]} />
      </div>
      <div className='opacity-85' style={{ transform: 'scale(0.97)' }}>
        <SkeletonCampaignRow campaign={MOCK_CAMPAIGNS[1]} />
      </div>
      <div className='relative z-10'>
        <SkeletonCampaignRow campaign={MOCK_CAMPAIGNS[0]} isMain />
      </div>
    </div>
  );
}

export function CampaignEmptyState() {
  const t = useTranslations('components.campaign.emptyState');

  return (
    <div className='relative mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center px-4 pt-8 pb-4 sm:justify-center sm:pt-14 sm:pb-4'>
      <div className='relative flex flex-col space-y-6 sm:order-2 sm:flex-none sm:pt-12'>
        <div className='space-y-3 text-center'>
          <h2 className='text-2xl font-semibold tracking-tight'>{t('title')}</h2>
          <p className='text-muted-foreground mx-auto max-w-md text-sm leading-relaxed'>{t('description')}</p>
        </div>
        <div className='flex justify-center'>
          <Button asChild className='shadow-primary/10 shadow-lg'>
            <Link href='https://betterlytics.io/docs/dashboard/campaigns' target='_blank'>
              <ExternalLink className='mr-2 h-4 w-4' />
              {t('docsLinkLabel')}
            </Link>
          </Button>
        </div>
      </div>

      <div className='relative mt-12 w-full sm:order-1 sm:mt-0'>
        <FannedCampaignPreview />
      </div>
    </div>
  );
}
