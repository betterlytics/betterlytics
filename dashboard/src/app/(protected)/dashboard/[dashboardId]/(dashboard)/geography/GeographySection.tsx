'use client';

import { use, useMemo, useState } from 'react';
import { getWorldMapDataAlpha2 } from '@/app/actions/analytics/geography.actions';
import LeafletMap from '@/components/map/LeafletMap';
import SubdivisionPanel from '@/components/map/SubdivisionPanel';
import type { FeatureDisplayResolver } from '@/components/map/types';
import { getCountryName } from '@/utils/countryCodes';
import { useLocale, useTranslations } from 'next-intl';

type GeographySectionProps = {
  worldMapPromise: ReturnType<typeof getWorldMapDataAlpha2>;
  subdivisionEnabled: boolean;
};

export default function GeographySection({ worldMapPromise, subdivisionEnabled }: GeographySectionProps) {
  const mapData = use(worldMapPromise);
  const t = useTranslations('components.geography');
  const locale = useLocale();
  const [selectedCountry, setSelectedCountry] = useState<{ code: string; name: string } | null>(null);

  const countryResolver = useMemo<FeatureDisplayResolver>(
    () => (featureId) => ({ name: getCountryName(featureId, locale), countryCode: featureId }),
    [locale],
  );

  const shouldHideFeature = useMemo(() => {
    const hasAntarctica = mapData.visitorData.some((d) => d.code === 'AQ' && d.visitors);
    return (id: string) => id === 'AQ' && !hasAntarctica;
  }, [mapData.visitorData]);

  return (
    <>
      <div className='h-full w-full'>
        <LeafletMap
          {...mapData}
          showZoomControls={true}
          size='lg'
          resolveDisplay={countryResolver}
          shouldHideFeature={shouldHideFeature}
          onFeatureClick={subdivisionEnabled ? (code) =>
            setSelectedCountry({ code, name: getCountryName(code, locale) }) : undefined
          }
        />
      </div>

      {mapData.visitorData.length === 0 && (
        <div className='absolute right-4 bottom-4 rounded-md border border-amber-200 bg-amber-50 p-3 shadow-md'>
          <p className='text-sm text-amber-700'>{t('noData')}</p>
        </div>
      )}

      {subdivisionEnabled && selectedCountry && (
        <SubdivisionPanel
          open={!!selectedCountry}
          parentCode={selectedCountry.code}
          parentDisplayName={selectedCountry.name}
          geoLevel="subdivision_code"
          parentLevel="country_code"
          geoJsonUrl={`/data/regions/${selectedCountry.code}.geo.json`}
          onClose={() => setSelectedCountry(null)}
        />
      )}
    </>
  );
}
