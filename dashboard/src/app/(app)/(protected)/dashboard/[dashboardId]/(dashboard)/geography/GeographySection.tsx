'use client';

import LeafletMap from '@/components/map/LeafletMap';
import SubdivisionPanel from '@/components/map/panel/SubdivisionPanel';
import { useSubdivisionPanel } from '@/components/map/panel/use-subdivision-panel';
import { hideAntarcticaWhenEmpty } from '@/components/map/types';
import { useTranslations } from 'next-intl';
import { useBAQueryParams } from '@/trpc/hooks';
import { trpc } from '@/trpc/client';
import { QuerySection } from '@/components/QuerySection';
import GeographyLoading from '@/components/loading/GeographyLoading';
import { useCallback, useRef } from 'react';

export default function GeographySection({ subdivisionsEnabled = false }: { subdivisionsEnabled?: boolean }) {
  const { input, options } = useBAQueryParams();
  const query = trpc.geography.worldMap.useQuery(input, options);
  const { countryCode, open, close } = useSubdivisionPanel();
  const t = useTranslations('components.geography');

  // Leaflet binds click handlers once per GeoJSON mount; the ref keeps the toggle closure fresh
  const clickRef = useRef<(featureId: string) => void>(() => {});
  clickRef.current = (featureId) => (featureId === countryCode ? close() : open(featureId));
  const handleFeatureClick = useCallback((featureId: string) => clickRef.current(featureId), []);

  return (
    <>
      <QuerySection query={query} fallback={<GeographyLoading />} className='h-full w-full'>
        {(mapData) => (
          <>
            <div className='h-full w-full'>
              <LeafletMap
                {...mapData}
                showZoomControls={true}
                size='lg'
                shouldHideFeature={hideAntarcticaWhenEmpty}
                onFeatureClick={subdivisionsEnabled ? handleFeatureClick : undefined}
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
      {subdivisionsEnabled && <SubdivisionPanel />}
    </>
  );
}
