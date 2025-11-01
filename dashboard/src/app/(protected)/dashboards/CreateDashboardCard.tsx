'use client';

import { Card } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { CreateDashboardDialog } from '@/app/(protected)/dashboards/CreateDashboardDialog';
import { getUserDashboardStatsAction } from '@/app/actions/dashboard';
import { useTranslations } from 'next-intl';

export function CreateDashboardCard({
  dashboardStatsPromise,
}: {
  dashboardStatsPromise: ReturnType<typeof getUserDashboardStatsAction>;
}) {
  const t = useTranslations('dashboardsPage');

  return (
    <CreateDashboardDialog
      dashboardStatsPromise={dashboardStatsPromise}
      trigger={
        <Card
          role='button'
          tabIndex={0}
          aria-label={t('createCard.title')}
          className='group border-border/70 hover:border-primary/30 focus-visible:border-primary/40 h-full cursor-pointer items-center justify-center border-2 border-dashed p-6 text-center transition-all outline-none hover:scale-[1.01] hover:shadow-lg focus-visible:scale-[1.01] focus-visible:shadow-lg'
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
