'use client';

import { Link } from '@/i18n/navigation';
import { useBARouter } from '@/hooks/use-ba-router';
import { Dashboard } from '@/entities/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Globe, Calendar, Settings } from 'lucide-react';
import { useFormattedDate } from '@/hooks/use-formatted-date';
import { useTranslations } from 'next-intl';

interface DashboardCardProps {
  dashboard: Dashboard;
}

export default function DashboardCard({ dashboard }: DashboardCardProps) {
  const t = useTranslations('misc');
  const router = useBARouter();

  const { formattedDate, loading: loadingDate } = useFormattedDate(dashboard.createdAt, {
    options: { year: 'numeric', month: 'short', day: 'numeric' },
  });

  const handleCardClick = () => {
    router.push(`/dashboard/${dashboard.id}`);
  };

  return (
    <Card className='group hover:border-primary/30 border-border/50 h-full cursor-pointer transition-all duration-200 hover:shadow-lg'>
      <div className='block h-full' onClick={handleCardClick}>
        <CardHeader className='pb-4'>
          <div className='flex items-start justify-between'>
            <div className='flex items-center gap-3'>
              <div className='bg-primary/10 group-hover:bg-primary/20 rounded-lg p-2 transition-colors'>
                <Globe className='text-primary h-5 w-5' />
              </div>
              <div className='min-w-0 flex-1'>
                <CardTitle className='group-hover:text-primary truncate text-lg font-semibold transition-colors'>
                  {dashboard.domain}
                </CardTitle>
                <p className='text-muted-foreground mt-1 text-sm'>{dashboard.siteId}</p>
              </div>
            </div>
            <div className='flex w-8 justify-center'>
              <ExternalLink className='text-muted-foreground h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100' />
            </div>
          </div>
        </CardHeader>
        <CardContent className='pt-0'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
              <div className='flex w-9 justify-center'>
                <Calendar className='text-muted-foreground h-3 w-3' />
              </div>
              <span className='text-muted-foreground text-xs'>
                {loadingDate ? (
                  t('loading')
                ) : (
                  <>
                    {t('created')} <span className='text-foreground'>{formattedDate}</span>
                  </>
                )}
              </span>
            </div>
            <div className='flex w-8 justify-center'>
              <Link
                href={`/dashboard/${dashboard.id}?settings=true`}
                className='hover:bg-muted inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md p-0 transition-colors'
                title='Dashboard Settings'
                onClick={(e) => e.stopPropagation()}
              >
                <Settings className='text-muted-foreground h-4 w-4' />
              </Link>
            </div>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
