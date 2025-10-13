'use client';

import { MapPlayActionbar } from '@/components/map/deckgl/controls/MapPlayActionbar';
import { PlaybackSpeed } from '@/components/map/deckgl/controls/PlaybackSpeedDropdown';
import DeckGLStickyTooltip from '@/components/map/deckgl/DeckGLStickyTooltip';
import { useMapSelectionActions } from '@/contexts/DeckGLSelectionContextProvider';
import { type GeoVisitor, type TimeGeoVisitors } from '@/entities/geography';
import { usePlayback } from '@/hooks/deckgl/use-playback';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type getWorldMapGranularityTimeseries } from '@/app/actions';
import { useDeckGLMapStyle } from '@/hooks/use-deckgl-mapstyle';
import DeckGLMap, { DeckGLMapProps } from './DeckGLMap';
import { ZoomControls } from './controls/ZoomControls';
import { DeckGLPopup } from './DeckGLPopup';
import { DateTimeSliderLabel } from './controls/DateTimeSliderLabel';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export type MapTimeseries = {
  visitorData: Awaited<ReturnType<typeof getWorldMapGranularityTimeseries>>;
  animationDurationBaseline?: number;
};

export default function MapTimeseries({ visitorData, animationDurationBaseline = 1000 }: MapTimeseries) {
  const containerRef = useRef<HTMLDivElement>(null);

  const { hoveredFeatureRef, setMapSelection } = useMapSelectionActions();
  const { granularity } = useTimeRangeContext();
  const isMobile = useIsMobile();

  const visitorDataTimeseries: TimeGeoVisitors[] = useMemo(() => {
    const timeseries: TimeGeoVisitors[] = [];

    for (const timeData of visitorData.data) {
      const visitors: GeoVisitor[] = Object.entries(timeData)
        .filter(([key]) => key !== 'date')
        .map(([country_code, visitors]) => ({
          country_code,
          visitors,
        }));

      timeseries.push({
        visitors: visitors,
        date: new Date(timeData.date),
      });
    }

    return timeseries;
  }, [visitorData]);

  const maxVisitors = useMemo(() => {
    return Math.max(...visitorDataTimeseries.flatMap((frame) => frame.visitors.map((d) => d.visitors)));
  }, [visitorDataTimeseries]);

  const style = useDeckGLMapStyle({ maxVisitors });

  const [speed, setSpeed] = useState(1 as PlaybackSpeed);

  const { position, frame, playing, toggle, scrub } = usePlayback({
    frameCount: visitorDataTimeseries.length,
    speed,
  });

  useEffect(() => {
    //! TODO: Update more gracefully
    setMapSelection(null);
  }, [playing, frame]);

  const tickProps = useMemo(
    () =>
      visitorDataTimeseries.map((tgeo, i) => ({
        label: <DateTimeSliderLabel value={tgeo.date} granularity={granularity} />,
        value: tgeo.date,
      })),
    [visitorDataTimeseries],
  );

  const visitorDict = useMemo(() => {
    const currentFrame = visitorDataTimeseries[frame];
    return Object.fromEntries(currentFrame.visitors.map((d) => [d.country_code, d.visitors]));
  }, [visitorDataTimeseries, frame]);

  const handleClick = useCallback(
    (info: any) => {
      if (info.object && !playing) {
        setMapSelection({
          clicked: {
            longitude: info?.coordinate?.[0],
            latitude: info?.coordinate?.[1],
            geoVisitor: {
              country_code: info.object.id as string,
              visitors: visitorDict[info.object.id] ?? 0,
            },
          },
        });
      } else {
        setMapSelection(null);
      }
    },
    [visitorDict, setMapSelection, playing],
  );

  const handleHover = useCallback(
    (info: any) => {
      const hoveredCountryCode = info.object?.id as string | undefined;
      const prev = hoveredFeatureRef.current?.geoVisitor.country_code;

      if (hoveredCountryCode === prev || playing) return;

      if (hoveredCountryCode) {
        setMapSelection({
          hovered: {
            geoVisitor: {
              country_code: hoveredCountryCode,
              visitors: visitorDict[hoveredCountryCode] ?? 0,
            },
          },
        });
      } else {
        setMapSelection({
          hovered: undefined,
        });
      }
    },
    [visitorDict, hoveredFeatureRef, playing],
  );

  const visitorChangeAnimation = useMemo<DeckGLMapProps['fillAnimation']>(
    () => ({
      duration: playing ? animationDurationBaseline / speed : animationDurationBaseline / 5,
      easing: (t: number) => t * t,
    }),
    [speed, playing, animationDurationBaseline],
  );

  const sidebarOffset = useMemo(() => (isMobile ? '0' : '17rem'), [isMobile]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100vh' }}>
      <DeckGLMap
        visitorData={visitorDict}
        frame={frame}
        style={style}
        onClick={handleClick}
        onHover={handleHover}
        fillAnimation={visitorChangeAnimation}
        outlineAnimation={visitorChangeAnimation}
      />
      <MapPlayActionbar
        className={cn('pointer-events-auto fixed bottom-8 z-12 w-[calc(100%-18rem)]', `left-[${sidebarOffset}]`)}
        ticks={tickProps}
        value={position}
        playing={playing}
        speed={speed}
        onTogglePlay={toggle}
        onScrub={scrub}
        onChangeSpeed={setSpeed}
      />

      <ZoomControls
        className={cn('pointer-events-auto absolute top-3 left-[17rem] z-12', `left-[${sidebarOffset}]`)}
      />
      {containerRef && <DeckGLStickyTooltip containerRef={containerRef} />}
      <DeckGLPopup />
    </div>
  );
}
