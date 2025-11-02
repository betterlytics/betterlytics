'use client';

import { type getWorldMapGranularityTimeseries } from '@/app/actions';
import DataEmptyComponent from '@/components/DataEmptyComponent';
import DateTimeSliderLabel from '@/components/map/deckgl/controls/DateTimeSliderLabel';
import { MapPlayActionbar } from '@/components/map/deckgl/controls/MapPlayActionbar';
import { PlaybackSpeed } from '@/components/map/deckgl/controls/PlaybackSpeedDropdown';
import TimeseriesToggleButton from '@/components/map/deckgl/controls/TimeseriesToggleButton';
import ZoomControls from '@/components/map/deckgl/controls/ZoomControls';
import DeckGLMap, { DeckGLMapProps } from '@/components/map/deckgl/DeckGLMap';
import DeckGLStickyTooltip from '@/components/map/deckgl/DeckGLStickyTooltip';
import { useTimeRangeContext } from '@/contexts/TimeRangeContextProvider';
import { useDeckGLEventHandlers } from '@/hooks/deckgl/use-deckgl-with-compare';
import { useGeoTimeseriesData } from '@/hooks/deckgl/use-geotimeseries-data';
import { useIsMapHovered } from '@/hooks/deckgl/use-is-map-hovered';
import { usePlayback } from '@/hooks/deckgl/use-playback';
import { useDeckGLMapStyle } from '@/hooks/use-deckgl-mapstyle';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslations } from 'next-intl';
import { useCallback, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export type MapTimeseries = {
  visitorData: Awaited<ReturnType<typeof getWorldMapGranularityTimeseries>>;
  animationDurationBaseline?: number;
};

export default function MapTimeseries({ visitorData, animationDurationBaseline = 1000 }: MapTimeseries) {
  const containerRef = useRef<HTMLDivElement>(null);

  const timeRangeCtx = useTimeRangeContext();
  const isMobile = useIsMobile();
  const t = useTranslations('components.geography');

  const [isTimeseries, setIsTimeseries] = useState(true);
  const [frameAtToggleTimeseries, setFrameAtToggleTimeseries] = useState(0);
  const { isMapHovered, setIsMapHovered } = useIsMapHovered([
    '.deckgl-controller',
    'header',
    '[data-sidebar="sidebar"]',
  ]);

  const { visitorDataTimeseries, compareDataTimeseries, totalDataTimeseries, maxVisitors } = useGeoTimeseriesData({
    visitorData,
    isTimeseries,
  });

  const style = useDeckGLMapStyle({ maxVisitors });

  const [speed, setSpeed] = useState(1 as PlaybackSpeed);

  const { position, frame, playing, toggle, scrub } = usePlayback({
    frameCount: visitorDataTimeseries.length,
    speed,
  });

  const tickProps = useMemo(() => {
    if (!visitorDataTimeseries?.length || !totalDataTimeseries?.timeVisitors) return [];

    return visitorDataTimeseries.map((tgeo, i) => {
      const totalVisitors = totalDataTimeseries.timeVisitors[i]?.visitors ?? 0;
      const accTotal = totalDataTimeseries.accTotal ?? 0;
      const opacity = accTotal > 0 && totalVisitors > 0 ? Math.min((totalVisitors / accTotal) * Math.E, 1) : 0;

      return {
        thumbLabel: <DateTimeSliderLabel value={tgeo.date} granularity={timeRangeCtx.granularity} />,
        tickLabel: (
          <DateTimeSliderLabel
            className='font-mono'
            value={tgeo.date}
            granularity={timeRangeCtx.granularity}
            animate={false}
          />
        ),
        value: tgeo.date,
        opacity,
      };
    });
  }, [visitorDataTimeseries, totalDataTimeseries]);

  const visitorDict = useMemo(() => {
    const currentFrame = visitorDataTimeseries[frame];
    return Object.fromEntries(currentFrame.visitors.map((d) => [d.country_code, d.visitors]));
  }, [visitorDataTimeseries, frame]);

  const compareVisitorDict = useMemo(() => {
    if (!compareDataTimeseries || compareDataTimeseries.length === 0) return {};
    const compareFrame = compareDataTimeseries[frame] ?? compareDataTimeseries.at(-1)!;
    return Object.fromEntries(compareFrame.visitors.map((v) => [v.country_code, v.visitors]));
  }, [compareDataTimeseries, frame]);

  const { handleClick, handleHover } = useDeckGLEventHandlers({
    playing,
    frame,
    visitorDict,
    date: visitorDataTimeseries[frame].date,
    compareDate: compareDataTimeseries?.[frame].date,
    compareVisitorDict,
    setIsMapHovered,
  });

  const visitorChangeAnimation = useMemo<DeckGLMapProps['fillAnimation']>(
    () => ({
      // Set fillAnimation to 1/3 the play-speed
      duration: (playing ? animationDurationBaseline / speed : animationDurationBaseline / 5) / 3,
      easing: (t: number) => t * t,
    }),
    [speed, playing, animationDurationBaseline],
  );

  const sidebarOffset = useMemo(() => (isMobile ? 0 : 256), [isMobile]);

  const onToggleTimeseries = useCallback(() => {
    setIsTimeseries((prv) => !prv);
    const newFrame = frameAtToggleTimeseries.valueOf();
    setFrameAtToggleTimeseries(frame);

    scrub(newFrame);
  }, [setIsTimeseries, frame, setFrameAtToggleTimeseries]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100vh' }}>
      <DeckGLMap
        visitorData={visitorDict}
        colorUpdateTrigger={[frame, isTimeseries]}
        style={style}
        isMapHovered={isMapHovered}
        onClick={handleClick}
        onHover={handleHover}
        fillAnimation={visitorChangeAnimation}
        outlineAnimation={visitorChangeAnimation}
        isTimeseries={isTimeseries}
      />
      {
        <MapPlayActionbar
          className='deckgl-controller pointer-events-auto fixed bottom-5 z-12'
          ticks={tickProps}
          value={position}
          playing={playing}
          speed={speed}
          style={{
            width: isMobile ? '100vw' : 'calc(100vw - 256px - 1rem)',
            left: sidebarOffset,
          }}
          isTimeseries={isTimeseries}
          onTogglePlay={toggle}
          onToggleTimeseries={onToggleTimeseries}
          onScrub={scrub}
          onChangeSpeed={setSpeed}
        />
      }

      {!isTimeseries && (
        <TimeseriesToggleButton
          className='deckgl-controller pointer-events-auto fixed right-3 bottom-5 z-12 flex flex-col'
          isTimeseries={isTimeseries}
          onToggle={onToggleTimeseries}
        />
      )}
      <ZoomControls
        className={'deckgl-controller pointer-events-auto absolute top-3 z-12'}
        style={{ left: sidebarOffset + 16 }}
      />
      {containerRef && <DeckGLStickyTooltip containerRef={containerRef} />}

      {totalDataTimeseries.accTotal === 0 &&
        createPortal(
          <div className='shadow-3xlg bg-card fixed right-3 bottom-4 z-100 rounded-md border p-8'>
            <DataEmptyComponent style={{ height: '50px' }} />
          </div>,
          document.body,
        )}
    </div>
  );
}
