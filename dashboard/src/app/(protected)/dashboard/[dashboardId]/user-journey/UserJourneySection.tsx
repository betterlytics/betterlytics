'use client';

import { use } from 'react';
import { fetchUserJourneyAction } from '@/app/actions/analytics/userJourney.actions';
import UserJourneyChart from '@/app/(protected)/dashboard/[dashboardId]/user-journey/UserJourneyChart';
import { useTranslations } from 'next-intl';

type UserJourneySectionProps = {
  userJourneyPromise: ReturnType<typeof fetchUserJourneyAction>;
};

export default function UserJourneySection({ userJourneyPromise }: UserJourneySectionProps) {
  const t = useTranslations('dashboard.emptyStates');
  const journeyData = use(userJourneyPromise);
  console.log('heloooo', journeyData);

  return (
    <div className='relative min-h-[400px] overflow-x-auto'>
      {((journeyData && journeyData.nodes.length > 0) || true) && (
        <UserJourneyChart
          data={{
            nodes: [
              // depth 0 — entry points
              { id: 'home', name: '/', depth: 0, totalTraffic: 3200 },
              { id: 'dash_wildcard', name: '/dashboard/*', depth: 0, totalTraffic: 2100 },
              { id: 'dashboards', name: '/dashboards', depth: 0, totalTraffic: 1800 },
              { id: 'share_wildcard', name: '/share/*', depth: 0, totalTraffic: 900 },

              // depth 1 — mid funnel
              { id: 'dash_pages', name: '/dashboard/*/pages', depth: 1, totalTraffic: 1450 },
              { id: 'dash_main', name: '/dashboard/*', depth: 1, totalTraffic: 2600 },
              { id: 'share_mid', name: '/share/*', depth: 1, totalTraffic: 1000 },
              { id: 'onboarding', name: '/onboarding', depth: 1, totalTraffic: 950 },
              { id: 'dashboards_mid', name: '/dashboards', depth: 1, totalTraffic: 850 },

              // depth 2 — deeper navigation
              { id: 'web_vitals', name: '/dashboard/*/web-vitals', depth: 2, totalTraffic: 720 },
              { id: 'dashboards_2', name: '/dashboards', depth: 2, totalTraffic: 1650 },
              { id: 'dash_again', name: '/dashboard/*', depth: 2, totalTraffic: 1700 },
              { id: 'share_2', name: '/share/*', depth: 2, totalTraffic: 520 },

              // depth 3 — conversions / terminal
              { id: 'billing', name: '/billing', depth: 3, totalTraffic: 690 },
              { id: 'outbound', name: '/dashboard/*/outbound-links', depth: 3, totalTraffic: 620 },
              { id: 'user_journey', name: '/dashboard/*/user-journey', depth: 3, totalTraffic: 560 },
              { id: 'share_pages', name: '/share/*/pages', depth: 3, totalTraffic: 430 },
              { id: 'contact', name: '/contact', depth: 3, totalTraffic: 390 },
              { id: 'root_exit', name: '/', depth: 3, totalTraffic: 450 },
            ],

            links: [
              // depth 0 -> depth 1
              { source: 0, target: 4, value: 980 },
              { source: 0, target: 7, value: 620 },
              { source: 0, target: 6, value: 420 },
              { source: 1, target: 5, value: 1600 },
              { source: 2, target: 8, value: 780 },
              { source: 3, target: 6, value: 430 },

              // depth 1 -> depth 2
              { source: 4, target: 9, value: 620 },
              { source: 5, target: 10, value: 840 },
              { source: 5, target: 11, value: 910 },
              { source: 6, target: 12, value: 380 },
              { source: 7, target: 11, value: 510 },
              { source: 8, target: 10, value: 530 },

              // depth 2 -> depth 3
              { source: 9, target: 13, value: 340 },
              { source: 9, target: 14, value: 270 },
              { source: 10, target: 15, value: 560 },
              { source: 11, target: 16, value: 450 },
              { source: 11, target: 13, value: 320 },
              { source: 12, target: 17, value: 300 },
            ],
          }}
        />
      )}

      {journeyData?.nodes.length === 0 && false && (
        <div className='bg-muted rounded-xl p-8 text-center'>
          <div className='flex h-[300px] items-center justify-center'>
            <div className='text-center'>
              <p className='text-muted-foreground mb-1'>{t('noUserJourneyData')}</p>
              <p className='text-muted-foreground/70 text-xs'>{t('adjustTimeRange')}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
