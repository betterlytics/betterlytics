'server-only';

import {
  getAllCoreWebVitalPercentilesSeries,
  getCoreWebVitalsP75,
  getCoreWebVitalsAllPercentilesByDimension,
  hasCoreWebVitalsData,
} from '@/repositories/clickhouse/webVitals.repository';
import {
  CoreWebVitalsSummary,
  type CWVDimension,
  type CoreWebVitalName,
} from '@/entities/analytics/webVitals.entities';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';
import { getPerformanceScore } from '@/utils/coreWebVitals';

export async function getCoreWebVitalsSummaryForSite(siteQuery: BASiteQuery): Promise<CoreWebVitalsSummary> {
  return getCoreWebVitalsP75(siteQuery);
}

export async function getHasCoreWebVitalsData(siteId: string): Promise<boolean> {
  return hasCoreWebVitalsData(siteId);
}

export async function getAllCoreWebVitalPercentilesTimeseries(siteQuery: BASiteQuery) {
  return getAllCoreWebVitalPercentilesSeries(siteQuery);
}

export async function getCoreWebVitalsAllPercentilesPerDimension(siteQuery: BASiteQuery, dimension: CWVDimension) {
  return getCoreWebVitalsAllPercentilesByDimension(siteQuery, dimension);
}

type ScoreArray = [number, number, number, number]; // p50, p75, p90, p99

function computeScoreForRowPercentile(
  percentiles: Record<CoreWebVitalName, [number | null, number | null, number | null, number | null]>,
  percentileIndex: number,
): number {
  return getPerformanceScore(
    Object.fromEntries(
      Object.entries(percentiles).map(([metric, values]) => [metric, values[percentileIndex]]),
    ) as Partial<Record<CoreWebVitalName, number | null>>,
  );
}

export async function getCoreWebVitalsPreparedByDimension(siteQuery: BASiteQuery, dimension: CWVDimension) {
  const rows = await getCoreWebVitalsAllPercentilesPerDimension(siteQuery, dimension);

  const byKey = new Map<string, typeof rows>();
  for (const r of rows) {
    const list = byKey.get(r.key) || [];
    list.push(r);
    byKey.set(r.key, list);
  }

  const totalSamples = Array.from(byKey.values())
    .map((bucket) => bucket.reduce((acc, w) => acc + (w.samples || 0), 0))
    .reduce((a, b) => a + b, 0);

  const prepared = Array.from(byKey.entries()).map(([key, bucket]) => {
    const percentiles = Object.fromEntries(
      bucket.map((b) => [b.name, [b.p50, b.p75, b.p90, b.p99] as const]),
    ) as Record<CoreWebVitalName, [number | null, number | null, number | null, number | null]>;

    const samples = bucket.reduce((acc, w) => acc + (w.samples || 0), 0);

    const scores: ScoreArray = [0, 1, 2, 3].map((i) => computeScoreForRowPercentile(percentiles, i)) as ScoreArray;
    const opportunities: ScoreArray = scores.map((s) => {
      const share = totalSamples > 0 ? samples / totalSamples : 0;
      return share * (100 - s);
    }) as ScoreArray;

    const p75Pivot: Record<string, number | null> = Object.fromEntries(bucket.map((b) => [b.name, b.p75]));

    return {
      key,
      ...p75Pivot,
      __percentiles: percentiles,
      samples,
      __scores: scores,
      __opportunities: opportunities,
    };
  });

  return prepared;
}
