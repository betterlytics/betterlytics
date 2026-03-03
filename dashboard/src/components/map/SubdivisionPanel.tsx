'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { CountryDisplay } from '@/components/language/CountryDisplay';
import { FlagIconProps } from '@/components/icons';
import LeafletMap from '@/components/map/LeafletMap';
import type { FeatureDisplayResolver } from '@/components/map/types';
import type { GeoMapResponse, GeoLevel } from '@/entities/analytics/geography.entities';
import { getSubdivisionMapData } from '@/app/actions/analytics/geography.actions';
import { useDashboardId } from '@/hooks/use-dashboard-id';
import { useAnalyticsQuery } from '@/hooks/use-analytics-query';
import { useMapStyle } from '@/hooks/use-leaflet-style';
import { formatNumber } from '@/utils/formatters';
import { Spinner } from '@/components/ui/spinner';
import React, { useEffect, useState, useTransition, useMemo } from 'react';
import { useTranslations } from 'next-intl';

const COUNTRY_CODE_RE = /^[A-Z]{2}$/;

type SubdivisionPanelProps = {
  open: boolean;
  parentCode: string;
  parentDisplayName: string;
  geoLevel: GeoLevel;
  parentLevel: GeoLevel;
  geoJsonUrl: string;
  onClose: () => void;
};

function createFeatureResolver(
  geoJson: GeoJSON.FeatureCollection,
  parentCountryCode: string,
): FeatureDisplayResolver {
  const nameMap = new Map<string, string>();
  for (const feature of geoJson.features) {
    if (feature.id) {
      nameMap.set(String(feature.id), feature.properties?.name ?? String(feature.id));
    }
  }
  return (featureId) => ({
    name: nameMap.get(featureId) ?? featureId,
    countryCode: parentCountryCode,
  });
}

export default function SubdivisionPanel({
  open,
  parentCode,
  parentDisplayName,
  geoLevel,
  parentLevel,
  geoJsonUrl,
  onClose,
}: SubdivisionPanelProps) {
  const [subdivisionData, setSubdivisionData] = useState<GeoMapResponse | null>(null);
  const [subdivisionGeoJson, setSubdivisionGeoJson] = useState<GeoJSON.FeatureCollection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const dashboardId = useDashboardId();
  const query = useAnalyticsQuery();
  const t = useTranslations('components.geography');

  useEffect(() => {
    if (!open) return;

    if (!COUNTRY_CODE_RE.test(parentCode)) {
      setError(t('regionLoadError'));
      return;
    }

    setSubdivisionData(null);
    setSubdivisionGeoJson(null);
    setError(null);

    startTransition(() => {
      const load = async () => {
        try {
          const [data, geoRes] = await Promise.all([
            getSubdivisionMapData(dashboardId, query, parentCode),
            fetch(geoJsonUrl),
          ]);

          if (!geoRes.ok) {
            setError(t('regionLoadError'));
            return;
          }
          const geoJson = await geoRes.json();

          setSubdivisionData(data);
          setSubdivisionGeoJson(geoJson);
        } catch {
          setError(t('regionLoadError'));
        }
      };

      load();
    });
  }, [open, parentCode, geoLevel, parentLevel, dashboardId, query, t]);

  const featureResolver = useMemo<FeatureDisplayResolver | undefined>(() => {
    if (!subdivisionGeoJson) return undefined;
    return createFeatureResolver(subdivisionGeoJson, parentCode);
  }, [subdivisionGeoJson, parentCode]);

  const sortedFeatures = useMemo(() => {
    if (!subdivisionData || !featureResolver) return [];
    return [...subdivisionData.visitorData].sort((a, b) => b.visitors - a.visitors);
  }, [subdivisionData, featureResolver]);

  const style = useMapStyle({ maxValue: subdivisionData?.maxVisitors || 1 });

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()} modal={false}>
      <SheetContent
        side='right'
        className='!w-[calc(100vw-16rem)] !max-w-none overflow-y-auto'
        overlay={false}
      >
        <SheetHeader>
          <SheetTitle>
            <CountryDisplay
              countryCode={parentCode as FlagIconProps['countryCode']}
              countryName={parentDisplayName}
            />
          </SheetTitle>
          <SheetDescription className='sr-only'>{parentDisplayName}</SheetDescription>
        </SheetHeader>

        {error ? (
          <div className='flex h-[400px] w-full items-center justify-center'>
            <p className='text-destructive text-sm'>{error}</p>
          </div>
        ) : isPending || !subdivisionData || !subdivisionGeoJson || !featureResolver ? (
          <div className='flex h-[400px] w-full items-center justify-center'>
            <Spinner size='sm' />
          </div>
        ) : (
          <>
            <div className='h-[500px] w-full px-4'>
              <LeafletMap
                geoJsonData={subdivisionGeoJson}
                visitorData={subdivisionData.visitorData}
                compareData={subdivisionData.compareData}
                maxVisitors={subdivisionData.maxVisitors}
                resolveDisplay={featureResolver}
                fitBounds={true}
                showZoomControls={true}
                showLegend={false}
                interactionConfig={{
                  dragging: true,
                  scrollWheelZoom: false,
                  doubleClickZoom: true,
                  touchZoom: true,
                }}
              />
            </div>

            <div className='px-4 pb-4'>
              <h3 className='text-muted-foreground mb-2 text-sm font-medium'>{t('visitors')}</h3>
              <div className='space-y-0.5'>
                {sortedFeatures.map((feature) => {
                  const display = featureResolver(feature.code);
                  const visitors = feature.visitors;
                  return (
                    <div
                      key={feature.code}
                      className='flex items-center justify-between py-1.5'
                    >
                      <div className='flex items-center gap-2'>
                        <div
                          className='h-2 w-2 rounded-full'
                          style={{
                            backgroundColor: visitors
                              ? style.fillColorScale(visitors)
                              : 'var(--muted-foreground)',
                          }}
                        />
                        <span className='text-sm truncate'>{display.name}</span>
                      </div>
                      <span className='text-muted-foreground text-sm tabular-nums'>
                        {formatNumber(visitors)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
