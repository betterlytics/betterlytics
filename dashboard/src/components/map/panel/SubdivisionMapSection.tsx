'use client';

import LeafletMap from '@/components/map/LeafletMap';
import { ProgressBarList } from '@/components/ProgressBarList';
import { FlagIcon, type FlagIconProps } from '@/components/icons';
import { useRegionGeoJson } from './use-region-geojson';
import { featureVisitorsToProgressRows } from './featureRows';
import { createRegionDisplayResolver } from '@/utils/regionDisplay';
import { getCountryName } from '@/utils/countryCodes';
import { REGION_MAP_COUNTRIES } from '@/constants/regionCountries';
import { trpc } from '@/trpc/client';
import { useBAQueryParams } from '@/trpc/hooks';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { QuerySection } from '@/components/QuerySection';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import GeographyLoading from '@/components/loading/GeographyLoading';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';

export default function SubdivisionMapSection({ countryCode }: { countryCode: string }) {
  const { input, options } = useBAQueryParams();
  const query = trpc.geography.subdivisionMap.useQuery({ ...input, countryCode }, options);
  const geoJsonQuery = useRegionGeoJson(countryCode);
  const { compareMode } = useTimeRangeContext();
  const locale = useLocale();
  const t = useTranslations('components.geography');
  const tDashboard = useTranslations('dashboard');

  const showMap = REGION_MAP_COUNTRIES.has(countryCode) && !geoJsonQuery.isError;

  const resolveDisplay = useMemo(
    () => createRegionDisplayResolver(countryCode, geoJsonQuery.data, locale),
    [countryCode, geoJsonQuery.data, locale],
  );

  const flag = (
    <FlagIcon
      countryCode={countryCode as FlagIconProps['countryCode']}
      countryName={getCountryName(countryCode, locale)}
    />
  );

  return (
    <QuerySection
      query={query}
      fallback={
        <div className='h-full px-4 pb-4'>
          <GeographyLoading />
        </div>
      }
      className='min-h-0 flex-1'
    >
      {(mapData) => (
        <div className='grid h-full grid-rows-[auto_auto_auto_minmax(0,1fr)]'>
          {showMap ? (
            <div className='h-[280px] px-4 pb-4'>
              {geoJsonQuery.data ? (
                <LeafletMap
                  key={countryCode}
                  {...mapData}
                  geoJsonData={geoJsonQuery.data}
                  resolveDisplay={resolveDisplay}
                  fitBounds
                  showZoomControls
                  showLegend={false}
                  interactionConfig={{
                    dragging: true,
                    scrollWheelZoom: false,
                    doubleClickZoom: true,
                    touchZoom: true,
                  }}
                />
              ) : (
                <GeographyLoading />
              )}
            </div>
          ) : (
            <p className='text-muted-foreground px-4 py-2 text-sm'>{t('noRegionalMap')}</p>
          )}
          <Separator />
          <h3 className='px-4 pt-3 pb-2 text-base font-medium'>{tDashboard('tabs.regions')}</h3>
          <ScrollArea className='h-full min-h-0'>
            <div className='px-4 pb-4'>
              <ProgressBarList
                data={featureVisitorsToProgressRows({
                  visitorData: mapData.visitorData,
                  compareData: mapData.compareData,
                  compareEnabled: compareMode !== 'off',
                  labelOf: (code) => (code ? resolveDisplay(code).name : t('unknownRegion')),
                  icon: flag,
                })}
              />
            </div>
          </ScrollArea>
        </div>
      )}
    </QuerySection>
  );
}
