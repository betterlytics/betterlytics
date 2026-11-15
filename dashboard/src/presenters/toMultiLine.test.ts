import { describe, expect, it } from 'vitest';
import { toWebVitalsPercentileChart } from '@/presenters/toMultiLine';
import { CoreWebVitalNamedPercentilesRow } from '@/entities/analytics/webVitals.entities';

const HOUR_1 = '2026-11-15 10:00:00';
const HOUR_2 = '2026-11-15 11:00:00';
const HOUR_3 = '2026-11-15 12:00:00';

function row(
  date: string,
  name: CoreWebVitalNamedPercentilesRow['name'],
  p50: number,
): CoreWebVitalNamedPercentilesRow {
  return { date, name, p50, p75: p50 + 1, p90: p50 + 2, p99: p50 + 3 };
}

const ts = (date: string) => Date.parse(`${date.replace(' ', 'T')}Z`);
const EMPTY = [null, null, null, null];

describe('toWebVitalsPercentileChart', () => {
  const rows = [
    row(HOUR_1, 'LCP', 1200),
    row(HOUR_1, 'CLS', 0.1),
    // Placeholder from the query's period filling
    row(HOUR_2, '', 0),
    row(HOUR_3, 'LCP', 1500),
  ];
  const chart = toWebVitalsPercentileChart(rows);

  it('keeps real percentiles for periods with samples', () => {
    expect(chart.LCP[0]).toEqual({ date: ts(HOUR_1), value: [1200, 1201, 1202, 1203] });
    expect(chart.LCP[2]).toEqual({ date: ts(HOUR_3), value: [1500, 1501, 1502, 1503] });
    expect(chart.CLS[0]).toEqual({ date: ts(HOUR_1), value: [0.1, 1.1, 2.1, 3.1] });
  });

  it('leaves a filled period without samples empty for every metric', () => {
    for (const series of Object.values(chart)) {
      expect(series[1]).toEqual({ date: ts(HOUR_2), value: EMPTY });
    }
  });

  it('keeps a period where only other metrics have samples, empty for the missing metric', () => {
    expect(chart.CLS[2]).toEqual({ date: ts(HOUR_3), value: EMPTY });
    expect(chart.INP[0]).toEqual({ date: ts(HOUR_1), value: EMPTY });
  });

  it('gives every metric one point per period, in time order', () => {
    const expectedDates = [ts(HOUR_1), ts(HOUR_2), ts(HOUR_3)];
    for (const series of Object.values(chart)) {
      expect(series.map((point) => point.date)).toEqual(expectedDates);
    }
  });

  it('returns empty series when there are no rows', () => {
    expect(toWebVitalsPercentileChart([])).toEqual({ CLS: [], LCP: [], INP: [], FCP: [], TTFB: [] });
  });
});
