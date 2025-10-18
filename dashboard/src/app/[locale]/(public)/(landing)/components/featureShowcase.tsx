import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import AdvancedFiltersCard from './featureCards/advancedFiltersCard';
import FunnelsCard from './featureCards/funnelsCard';
import EventTrackingCard from './featureCards/eventTrackingCard';
import UserJourneyCard from './featureCards/userJourneyCard';
import WorldMapCard from './featureCards/worldMapCard';
import TrafficSourcesCard from './featureCards/trafficSourcesCard';
import ExternalLink from '@/components/ExternalLink';
import { getTranslations } from 'next-intl/server';

export async function FeatureShowcase() {
  const t = await getTranslations('public.landing.showcase');
  return (
    <section className='bg-card/20 relative overflow-hidden py-20'>
      <div className='absolute inset-0 bg-gradient-to-br from-blue-50/10 via-transparent to-purple-50/10 dark:from-blue-950/10 dark:via-transparent dark:to-purple-950/10' />

      <div className='relative container mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='mb-16 text-center'>
          <h2 className='mb-4 text-3xl font-bold sm:text-4xl'>
            <span className='text-blue-600 dark:text-blue-400'>{t('titleEmphasis')}</span> {t('titleRest')}
          </h2>
          <p className='text-muted-foreground mx-auto max-w-2xl text-xl'>{t('subtitle')}</p>
        </div>

        <div className='mx-auto max-w-7xl'>
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
            <AdvancedFiltersCard />
            <FunnelsCard />
            <EventTrackingCard />
            <UserJourneyCard />
            <WorldMapCard />
            <TrafficSourcesCard />
          </div>
        </div>

        <div className='mt-8 flex justify-center'>
          <Button variant='outline' size='lg' asChild>
            <ExternalLink href='/docs' title={t('docsTitle')}>
              {t('docsButton')}
              <ChevronRight className='ml-2 h-4 w-4' />
            </ExternalLink>
          </Button>
        </div>
      </div>
    </section>
  );
}
