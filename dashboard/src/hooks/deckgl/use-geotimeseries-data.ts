'use client';

import { useMemo } from 'react';
import type { GeoVisitor, TimeGeoVisitors } from '@/entities/geography';
import type { getWorldMapGranularityTimeseries } from '@/app/actions';

type UseGeoTimeseriesDataProps = {
  visitorData: Awaited<ReturnType<typeof getWorldMapGranularityTimeseries>>;
  isTimeseries: boolean;
};

type TotalDataTimeseries = { timeVisitors: { date: Date; visitors: number }[]; accTotal: number };

/**
 * Normalizes server response into:
 * - visitorDataTimeseries: primary frames
 * - compareDataTimeseries: compare frames (if present)
 */
export function useGeoTimeseriesData({ visitorData, isTimeseries }: UseGeoTimeseriesDataProps): {
  visitorDataTimeseries: TimeGeoVisitors[];
  totalDataTimeseries: TotalDataTimeseries;
  compareDataTimeseries?: TimeGeoVisitors[];
  maxVisitors: number;
} {
  const visitorDataTimeseries: TimeGeoVisitors[] = useMemo(() => {
    if (!isTimeseries) {
      return [
        {
          visitors: visitorData.accumulated.map((d) => ({
            country_code: d.country_code,
            visitors: d.visitors,
          })),
          date: new Date(),
        },
      ];
    }

    const frames: TimeGeoVisitors[] = [];
    for (const timeData of visitorData.data) {
      const visitors: GeoVisitor[] = Object.entries(timeData)
        .filter(([key]) => key !== 'date')
        .map(([country_code, visitors]) => ({ country_code, visitors }));

      frames.push({
        visitors,
        date: new Date(timeData.date),
      });
    }
    return frames;
  }, [visitorData, isTimeseries]);

  const totalDataTimeseries: TotalDataTimeseries = useMemo(() => {
    const timeVisitors = visitorDataTimeseries.map((timeGeoVisitor) => ({
      visitors: timeGeoVisitor.visitors.reduce(
        (acc, cur) => acc + (cur.country_code !== 'Localhost' ? cur.visitors : 0),
        0,
      ),
      date: timeGeoVisitor.date,
    }));

    return {
      timeVisitors: timeVisitors,
      accTotal: timeVisitors.reduce((acc, cur) => acc + cur.visitors, 0),
    };
  }, [visitorDataTimeseries]);

  const compareDataTimeseries: TimeGeoVisitors[] | undefined = useMemo(() => {
    if (!visitorData.compare) return undefined;

    if (!isTimeseries) {
      return [
        {
          visitors: visitorData.compare.accumulated.map((d) => ({
            country_code: d.country_code,
            visitors: d.visitors,
          })),
          date: new Date(),
        },
      ];
    }

    const cmp = visitorData.compare?.timeseries?.data;
    if (!cmp) return undefined;

    const frames: TimeGeoVisitors[] = [];
    for (const timeData of cmp) {
      const visitors: GeoVisitor[] = Object.entries(timeData)
        .filter(([key]) => key !== 'date')
        .map(([country_code, visitors]) => ({ country_code, visitors }));

      frames.push({
        visitors,
        date: new Date(timeData.date),
      });
    }
    return frames;
  }, [visitorData, isTimeseries]);

  const maxVisitors = useMemo(() => {
    return Math.max(...visitorDataTimeseries.flatMap((frame) => frame.visitors.map((d) => d.visitors)));
  }, [visitorDataTimeseries]);

  return { visitorDataTimeseries, compareDataTimeseries, maxVisitors, totalDataTimeseries };
}
