'use client';

import LeafletMap from '@/components/map/LeafletMap';
import { MapProvider } from '@/components/map/MapProvider';
import GeographyToolbar from '@/app/(app)/(protected)/dashboard/[dashboardId]/(dashboard)/geography/GeographyToolbar';
import SubdivisionDrilldown from '@/components/map/panel/SubdivisionDrilldown';
import { useSubdivisionDrilldown } from '@/components/map/panel/use-subdivision-drilldown';
import { hideAntarcticaWhenEmpty } from '@/components/map/types';
import { useTranslations } from 'next-intl';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { QuerySection } from '@/components/QuerySection';
import GeographyLoading from '@/components/loading/GeographyLoading';

export default function GeographySection({ subdivisionsEnabled = false }: { subdivisionsEnabled?: boolean }) {
  const { input, options } = useBAQueryParams();
  const query = trpc.geography.worldMap.useQuery(input, options);
  const drilldown = useSubdivisionDrilldown();
  const t = useTranslations('components.geography');

  return (
    <MapProvider>
      <GeographyToolbar />
      <QuerySection query={query} fallback={<GeographyLoading />} className='h-full w-full'>
        {(mapData) => (
          <>
            <div className='h-full w-full'>
              <LeafletMap
                {...mapData}
                size='lg'
                shouldHideFeature={hideAntarcticaWhenEmpty}
                onFeatureClick={subdivisionsEnabled ? drilldown.toggle : undefined}
                selectedFeatureId={subdivisionsEnabled ? drilldown.countryCode : undefined}
              />
            </div>

            {mapData.visitorData.length === 0 && (
              <div className='absolute right-4 bottom-4 rounded-md border border-amber-200 bg-amber-50 p-3 shadow-md'>
                <p className='text-sm text-amber-700'>{t('noData')}</p>
              </div>
            )}
          </>
        )}
      </QuerySection>
      {subdivisionsEnabled && <SubdivisionDrilldown drilldown={drilldown} />}
    </MapProvider>
  );
}
