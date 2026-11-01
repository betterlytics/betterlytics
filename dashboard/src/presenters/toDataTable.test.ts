import { describe, expect, it } from 'vitest';
import { toDataTable } from '@/presenters/toDataTable';
import { REFERRER_TABLE_KEY, ReferrerTableRow } from '@/entities/analytics/referrers.entities';

const row = (source_type: string, source_name: string, source_url: string, visits: number): ReferrerTableRow => ({
  source_type,
  source_name,
  source_url,
  visits,
  bounce_rate: 0,
  avg_visit_duration: 0,
});

describe('toDataTable with the referrer table key', () => {
  const data = [
    row('direct', '', '', 10),
    row('email', 'Newsletter', '', 4),
    row('other', '', '', 2),
    row('search', 'Google', 'google.com', 8),
    row('social', 'Reddit', '', 3),
  ];
  const compare = [
    row('direct', '', '', 20),
    row('email', 'Newsletter', '', 2),
    row('other', '', '', 1),
    row('search', 'Google', 'google.com', 4),
  ];

  const result = toDataTable({ data, compare, categoryKey: REFERRER_TABLE_KEY });
  const find = (type: string) => result.find((r) => r.source_type === type)!;

  it('pairs Direct with its own previous row', () => {
    expect(find('direct').compare?.visits).toBe(20);
    expect(find('direct').change?.visits).toBe(-50);
  });

  it('pairs each empty-URL row with the previous row of the same category and source name', () => {
    expect(find('email').compare?.visits).toBe(2);
    expect(find('email').change?.visits).toBe(100);
    expect(find('other').compare?.visits).toBe(1);
    expect(find('other').change?.visits).toBe(100);
  });

  it('treats an empty-URL row with no previous match as new', () => {
    expect(find('social').compare).toBeUndefined();
    expect(find('social').change?.visits).toBe(300);
  });

  it('still pairs rows with a URL', () => {
    expect(find('search').compare?.visits).toBe(4);
    expect(find('search').change?.visits).toBe(100);
  });
});
