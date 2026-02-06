'use client';

import { use } from 'react';
import { Card } from '@/components/ui/card';
import { Plus, Crown } from 'lucide-react';
import { CreateDashboardDialog } from '@/app/(protected)/dashboards/CreateDashboardDialog';
import { getUserDashboardStatsAction } from '@/app/actions/dashboard/dashboard.action';
import { useTranslations } from 'next-intl';
import { ProBadge } from '@/components/billing/ProBadge';
import Link from 'next/link';

export function CreateDashboardCard({
  dashboardStatsPromise,
}: {
  dashboardStatsPromise: ReturnType<typeof getUserDashboardStatsAction>;
}) {
  const t = useTranslations('dashboardsPage');
  const dashboardStats = use(dashboardStatsPromise);
  const canCreateMore = dashboardStats.success && dashboardStats.data.canCreateMore;

  if (!canCreateMore) {
    return <UpgradeCard />;
  }

  return (
    <CreateDashboardDialog
      dashboardStatsPromise={dashboardStatsPromise}
      trigger={
        <Card
          role='button'
          tabIndex={0}
          aria-label={t('createCard.title')}
          className='group border-border/70 hover:border-primary/30 focus-visible:border-primary/40 relative h-full cursor-pointer items-center justify-center border-2 border-dashed p-6 text-center transition-card outline-none'
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              (e.currentTarget as HTMLElement).click();
            }
          }}
        >
          <div className='flex h-full flex-col items-center justify-center gap-3'>
            <div className='bg-primary/10 group-hover:bg-primary/20 rounded-lg p-3 transition-colors'>
              <Plus className='text-primary h-6 w-6' />
            </div>
            <div className='space-y-1'>
              <div className='text-foreground font-medium'>{t('createCard.title')}</div>
              <div className='text-muted-foreground text-sm'>{t('createCard.description')}</div>
            </div>
          </div>
        </Card>
      }
    />
  );
}

function UpgradeCard() {
  const t = useTranslations('dashboardsPage.upgradeCard');

  return (
    <Link href='/billing' className='block h-full'>
      <Card
        className='group relative h-full cursor-pointer items-center justify-center border-2 border-dashed border-amber-500/20 p-6 text-center transition-card outline-none hover:border-amber-500/35'
        style={{
          background:
            'linear-gradient(135deg, rgba(251,191,36,0.015) 0%, rgba(255,255,255,0.02) 50%, rgba(251,191,36,0.02) 100%)',
        }}
      >
        <div className='absolute top-3 right-3'>
          <ProBadge />
        </div>

        <div className='flex h-full flex-col items-center justify-center gap-3'>
          <div className='rounded-lg bg-amber-500/10 p-3 transition-colors group-hover:bg-amber-500/15'>
            <Crown className='h-6 w-6 text-amber-500' />
          </div>

          <div className='space-y-1'>
            <div className='text-foreground font-medium'>{t('title')}</div>
            <div className='text-muted-foreground text-sm'>{t('description')}</div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
