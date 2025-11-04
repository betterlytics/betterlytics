import { GeoTimeseriesResponseSchema, type GeoTimeseriesResponse, type GeoVisitor } from '@/entities/geography';
import type { TimeGeoVisitors, TotalData } from '@/entities/geography';

type ToGeoTimeseriesInput = {
  data: Array<Record<string, string | number>>;
  accumulated: Array<GeoVisitor>;
};

type ToGeoTimeseriesCompareInput = {
  timeseries: { data: Array<Record<string, string | number>> };
  accumulated: Array<GeoVisitor>;
};

/**
 * Presenter that transforms raw geography timeseries data into pre-computed views.
 * Returns BOTH timeseries frames and accumulated frame.
 */
export function toGeoTimeseries(
  input: ToGeoTimeseriesInput,
  compareInput?: ToGeoTimeseriesCompareInput,
): GeoTimeseriesResponse {
  const timeseries = transformTimeseriesFrames(input.data);
  const accumulated = transformAccumulatedFrame(input.accumulated);
  const totalData = calculateTotalTimeseries(timeseries);

  const compare = compareInput
    ? {
        timeseries: transformTimeseriesFrames(compareInput.timeseries.data),
        accumulated: transformAccumulatedFrame(compareInput.accumulated),
      }
    : undefined;

  const maxVisitorsTimeseries = Math.max(...timeseries.flatMap((frame) => frame.visitors.map((d) => d.visitors)));
  const maxVisitorsAccumulated = Math.max(...accumulated.visitors.map((d) => d.visitors));

  return GeoTimeseriesResponseSchema.parse({
    timeseries,
    accumulated,
    totalData,
    compare,
    maxVisitorsTimeseries,
    maxVisitorsAccumulated,
  } as GeoTimeseriesResponse);
}

/**
 * Transforms raw timeseries data into TimeGeoVisitors frames (one per time interval)
 */
function transformTimeseriesFrames(data: Array<Record<string, string | number>>): TimeGeoVisitors[] {
  const frames: TimeGeoVisitors[] = [];
  for (const timeData of data) {
    const visitors: GeoVisitor[] = Object.entries(timeData)
      .filter(([key]) => key !== 'date')
      .map(([country_code, visitors]) => ({ country_code, visitors: Number(visitors) }));

    frames.push({
      visitors,
      date: new Date(timeData.date as string),
    });
  }
  return frames;
}

/**
 * Transforms accumulated data into a single TimeGeoVisitors frame
 */
function transformAccumulatedFrame(
  accumulated: Array<{ country_code: string; visitors: number }>,
): TimeGeoVisitors {
  return {
    visitors: accumulated.map((d) => ({
      country_code: d.country_code,
      visitors: d.visitors,
    })),
    date: new Date(),
  };
}

/**
 * Calculates total visitors per time frame, excluding localhost
 */
function calculateTotalTimeseries(timeseries: TimeGeoVisitors[]): TotalData {
  const timeVisitors = timeseries.map((timeGeoVisitor) => ({
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
}
