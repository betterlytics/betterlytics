import { describe, expect, it } from 'vitest';
import { featureVisitorsToProgressRows } from './featureRows';

const labelOf = (code: string) => (code ? `name:${code}` : 'Unknown');

describe('featureVisitorsToProgressRows', () => {
  it('sorts by visitors descending and labels through the resolver', () => {
    const rows = featureVisitorsToProgressRows({
      visitorData: [
        { code: 'DK-85', visitors: 2 },
        { code: 'DK-84', visitors: 9 },
      ],
      compareData: [],
      compareEnabled: false,
      labelOf,
    });
    expect(rows.map((r) => r.label)).toEqual(['name:DK-84', 'name:DK-85']);
    expect(rows[0]).toMatchObject({
      key: 'DK-84',
      value: 9,
      comparisonValue: undefined,
      trendPercentage: undefined,
    });
  });

  it('computes the trend like toDataTable when compare is enabled', () => {
    const rows = featureVisitorsToProgressRows({
      visitorData: [
        { code: 'DK-84', visitors: 6 },
        { code: 'DK-85', visitors: 3 },
      ],
      compareData: [{ code: 'DK-84', visitors: 4 }],
      compareEnabled: true,
      labelOf,
    });
    expect(rows[0]).toMatchObject({ comparisonValue: 4, trendPercentage: 50 });
    expect(rows[1]).toMatchObject({ comparisonValue: undefined, trendPercentage: 300 });
  });

  it('keys the empty code as unknown', () => {
    const rows = featureVisitorsToProgressRows({
      visitorData: [{ code: '', visitors: 1 }],
      compareData: [],
      compareEnabled: false,
      labelOf,
    });
    expect(rows[0]).toMatchObject({ key: 'unknown', label: 'Unknown' });
  });
});
