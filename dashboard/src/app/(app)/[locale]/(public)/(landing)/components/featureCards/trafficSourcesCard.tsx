import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, ExternalLink } from 'lucide-react';
import { formatPercentage } from '@/utils/formatters';
import { getLocale, getTranslations } from 'next-intl/server';

export default async function TrafficSourcesCard() {
  const t = await getTranslations('public.landing.cards.trafficSources');
  const locale = await getLocale();
  const trafficSources = [
    {
      name: t('sources.googleSearch'),
      visitors: 3247,
      percentage: 42.8,
      icon: (
        <div className='flex h-6 w-6 items-center justify-center rounded-full bg-blue-500'>
          <span className='text-xs font-bold text-white'>G</span>
        </div>
      ),
      color: 'bg-blue-500',
    },
    {
      name: t('sources.direct'),
      visitors: 1834,
      percentage: 24.2,
      icon: (
        <div className='flex h-6 w-6 items-center justify-center rounded-full bg-gray-600'>
          <Globe className='h-3 w-3 text-white' />
        </div>
      ),
      color: 'bg-gray-600',
    },
    {
      name: t('sources.socialMedia'),
      visitors: 1456,
      percentage: 19.2,
      icon: (
        <div className='flex h-6 w-6 items-center justify-center rounded-full bg-pink-500'>
          <span className='text-xs font-bold text-white'>S</span>
        </div>
      ),
      color: 'bg-pink-500',
    },
    {
      name: t('sources.email'),
      visitors: 678,
      percentage: 8.9,
      icon: (
        <div className='flex h-6 w-6 items-center justify-center rounded-full bg-green-500'>
          <span className='text-xs font-bold text-white'>@</span>
        </div>
      ),
      color: 'bg-green-500',
    },
    {
      name: t('sources.other'),
      visitors: 365,
      percentage: 4.9,
      icon: (
        <div className='flex h-6 w-6 items-center justify-center rounded-full bg-orange-500'>
          <ExternalLink className='h-3 w-3 text-white' />
        </div>
      ),
      color: 'bg-orange-500',
    },
  ];

  const SourceItem = ({ source }: { source: (typeof trafficSources)[0] }) => (
    <div className='flex items-center justify-between space-x-3'>
      <div className='flex items-center space-x-3'>
        {source.icon}
        <div>
          <div className='text-sm font-medium'>{source.name}</div>
          <div className='text-muted-foreground text-xs'>
            {source.visitors.toLocaleString(locale)} {t('visitorsLabel')}
          </div>
        </div>
      </div>
      <div className='flex items-center space-x-2'>
        <span className='text-sm font-medium'>{formatPercentage(source.percentage, locale)}</span>
        <div className='bg-muted h-2 w-16 overflow-hidden rounded-full'>
          <div
            className={`h-full ${source.color}`}
            style={{ width: `${Math.min(source.percentage * 2, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );

  return (
    <Card className='bg-card/70 border-border/70 dark:border-border/60 before:via-primary/40 relative overflow-hidden border shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:to-transparent before:content-[""]'>
      <CardHeader className='pb-3'>
        <CardTitle className='text-xl'>{t('title')}</CardTitle>
        <CardDescription className='text-base'>{t('description')}</CardDescription>
      </CardHeader>

      <CardContent className='space-y-4'>
        <div className='space-y-3'>
          {trafficSources.map((source) => (
            <SourceItem key={source.name} source={source} />
          ))}
        </div>

        <div className='border-border/60 border-t pt-3'>
          <div className='flex items-center justify-between text-xs'>
            <span className='text-muted-foreground'>{t('totalVisitors')}</span>
            <div className='text-primary flex items-center'>
              <span className='font-medium'>{(7580).toLocaleString(locale)} {t('thisMonth')}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
