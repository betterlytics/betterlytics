import { useMemo } from 'react';
import DateTimeSliderLabel from '@/components/map/deckgl/controls/DateTimeSliderLabel';
import type { TimeGeoVisitors, TotalData } from '@/entities/geography';
import type { GranularityRangeValues } from '@/utils/granularityRanges';

type UseGeoTimeseriesSliderTicksProps = {
  frames: TimeGeoVisitors[];
  totalData: TotalData;
  granularity: GranularityRangeValues;
};

/**
 * Hook that generates slider tick properties for geography timeseries visualization.
 * Calculates opacity based on visitor distribution across frames.
 */
export function useGeoTimeseriesSliderTicks({
  frames,
  totalData,
  granularity,
}: UseGeoTimeseriesSliderTicksProps) {
  return useMemo(() => {
    if (!frames?.length || !totalData?.timeVisitors) return [];

    return frames.map((tgeo, i) => {
      const totalVisitors = totalData.timeVisitors[i]?.visitors ?? 0;
      const accTotal = totalData.accTotal ?? 0;
      const opacity = accTotal > 0 && totalVisitors > 0 ? Math.min((totalVisitors / accTotal) * Math.E, 1) : 0;

      return {
        thumbLabel: <DateTimeSliderLabel value={tgeo.date} granularity={granularity} />,
        tickLabel: (
          <DateTimeSliderLabel
            className='font-mono'
            value={tgeo.date}
            granularity={granularity}
            animate={false}
          />
        ),
        value: tgeo.date,
        opacity,
      };
    });
  }, [frames, totalData, granularity]);
}
