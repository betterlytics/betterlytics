import { Fragment, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import AdvancedFiltersCard from './featureCards/advancedFiltersCard';
import FunnelsCard from './featureCards/funnelsCard';
import EventTrackingCard from './featureCards/eventTrackingCard';
import UserJourneyCard from './featureCards/userJourneyCard';
import WorldMapCard from './featureCards/worldMapCard';
import TrafficSourcesCard from './featureCards/trafficSourcesCard';
import CoreWebVitalsCard from './featureCards/coreWebVitalsCard';
import SessionReplayCard from './featureCards/sessionReplayCard';
import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import UptimeMonitoringCard from './featureCards/uptimeMonitoringCard';

export async function FeatureShowcase() {
  const t = await getTranslations('public.landing.showcase');
  type FeatureCard = {
    id: string;
    element: ReactNode;
  };

  type FeatureCategory = {
    id: string;
    title: string;
    cards: FeatureCard[];
  };

  const featureCategories: FeatureCategory[] = [
    {
      id: 'analytics',
      title: t('categories.analytics'),
      cards: [
        { id: 'advanced-filters', element: <AdvancedFiltersCard /> },
        { id: 'funnels', element: <FunnelsCard /> },
        { id: 'world-map', element: <WorldMapCard /> },
      ],
    },
    {
      id: 'engagement',
      title: t('categories.engagement'),
      cards: [
        { id: 'event-tracking', element: <EventTrackingCard /> },
        { id: 'session-replay', element: <SessionReplayCard /> },
        { id: 'user-journey', element: <UserJourneyCard /> },
      ],
    },
    {
      id: 'performance',
      title: t('categories.performance'),
      cards: [
        { id: 'traffic-sources', element: <TrafficSourcesCard /> },
        { id: 'outbound-links', element: <UptimeMonitoringCard /> },
        { id: 'core-web-vitals', element: <CoreWebVitalsCard /> },
      ],
    },
  ];

  return (
    <section className='relative overflow-visible py-24 sm:py-28'>
      <div className='relative container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-16 text-center'>
          <h2 className='mb-4 text-3xl font-bold sm:text-4xl'>
            <span className='text-blue-600 dark:text-blue-400'>{t('titleEmphasis')}</span> {t('titleRest')}
          </h2>
          <p className='text-muted-foreground mx-auto max-w-2xl text-xl'>{t('subtitle')}</p>
        </div>

        <div className='mx-auto max-w-7xl'>
          {featureCategories.map((category, index) => {
            const wrapperClasses =
              index === 0 ? 'space-y-10 sm:space-y-10' : 'mt-16 sm:mt-20 space-y-10 sm:space-y-12';

            return (
              <div key={category.id} className={wrapperClasses}>
                <div className='flex flex-col items-center gap-4 text-center'>
                  <span className='from-primary/40 via-primary to-primary/40 h-[1.5px] w-16 bg-gradient-to-r' />
                  <h3 className='text-muted-foreground text-xs font-semibold tracking-[0.35em] uppercase sm:text-sm'>
                    {category.title}
                  </h3>
                </div>
                <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                  {category.cards.map(({ id, element }) => (
                    <Fragment key={id}>{element}</Fragment>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className='mt-8 flex justify-center'>
          <Button
            variant='outline'
            size='lg'
            className='group transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg focus-visible:-translate-y-0.5 focus-visible:shadow-lg motion-reduce:transform-none motion-reduce:transition-none'
            asChild
          >
            <Link href='/features' title={t('featuresTitle')}>
              {t('featuresButton')}
              <ChevronRight className='ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none' />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
