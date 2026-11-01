import { describe, expect, it } from 'vitest';
import { toDataTable } from '@/presenters/toDataTable';
import { REFERRER_TABLE_KEY, ReferrerTableRow } from '@/entities/analytics/referrers.entities';

const row = (
  source_type: string,
  source_name: string,
  source_url: string,
  visits: number,
  source_origin: ReferrerTableRow['source_origin'] = 'referrer',
): ReferrerTableRow => ({
  source_type,
  source_origin,
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
    row('ai', 'chatgpt.com', '', 6, 'utm_source'),
    row('ai', 'chatgpt.com', '', 1),
  ];
  const compare = [
    row('ai', 'chatgpt.com', '', 5),
    row('ai', 'chatgpt.com', '', 3, 'utm_source'),
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

  it('pairs a utm_source row only with the previous row of the same utm_source', () => {
    const ai = result.filter((r) => r.source_type === 'ai');
    expect(ai.find((r) => r.source_origin === 'utm_source')?.compare?.visits).toBe(3);
    expect(ai.find((r) => r.source_origin === 'referrer')?.compare?.visits).toBe(5);
  });

  it('still pairs rows with a URL', () => {
    expect(find('search').compare?.visits).toBe(4);
    expect(find('search').change?.visits).toBe(100);
  });
});
