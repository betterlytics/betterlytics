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
import { CWV_THRESHOLDS } from '@/constants/coreWebVitals';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

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

const METRIC_WEIGHTS: Record<CoreWebVitalName, number> = {
  LCP: 0.3,
  CLS: 0.15,
  FCP: 0.15,
  TTFB: 0.1,
  INP: 0.3,
};

function scoreForMetric(value: number | null | undefined, good: number, meh: number): number {
  if (value == null || Number.isNaN(value)) return 0;
  if (value <= good) {
    const frac = Math.max(0, Math.min(1, value / good));
    return 90 + (1 - frac) * 10;
  }
  if (value <= meh) {
    const frac = (value - good) / (meh - good);
    return 90 - frac * 40;
  }
  const over = Math.max(0, value - meh);
  const frac = Math.min(1, over / meh);
  return Math.max(0, 50 - frac * 50);
}

function computeScoreForRowPercentile(
  percentiles: Record<CoreWebVitalName, [number | null, number | null, number | null, number | null]>,
  percentileIndex: number,
): number {
  let weighted = 0;
  let weightSum = 0;
  (['LCP', 'CLS', 'FCP', 'TTFB', 'INP'] as CoreWebVitalName[]).forEach((metric) => {
    const value = percentiles[metric]?.[percentileIndex] ?? null;
    if (value == null) return;

    const [good, meh] = CWV_THRESHOLDS[metric];
    const s = scoreForMetric(value, good, meh);
    const w = METRIC_WEIGHTS[metric];
    weighted += s * w;
    weightSum += w;
  });
  return weightSum > 0 ? weighted / weightSum : 0;
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
