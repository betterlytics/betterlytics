import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/clickhouse', () => ({ clickhouse: { query: vi.fn() } }));
vi.mock('@/lib/env', () => ({
  env: { SAMPLING_TRAFFIC_THRESHOLD: 100_000, SAMPLING_FACTOR: 0.25, HIGH_TRAFFIC_CONCURRENCY_LIMIT: 20 },
}));
vi.mock('@/repositories/clickhouse/usage.repository', () => ({
  isHighTrafficSite: vi.fn().mockResolvedValue(false),
}));
vi.mock('@/observability/clickhouse-concurrency', () => ({ setSiteConcurrencyLimit: vi.fn() }));

import { buildJourneyQuery } from '@/repositories/clickhouse/userJourney.repository';
import { safeSql } from '@/lib/safe-sql';
import type { QueryFilter } from '@/entities/analytics/filter.entities';

const urlFilter = (values: string[], operator: '=' | '!=' = '='): QueryFilter => ({
  id: 'f',
  column: 'url',
  operator,
  values,
});

const build = (stepFilters: Record<string, QueryFilter[]>, queryFilters: QueryFilter[] = []) =>
  buildJourneyQuery({ queryFilters, stepFilters, sample: safeSql`SAMPLE 1` });

describe('buildJourneyQuery', () => {
  it('applies session-level step filters in the ordered_events WHERE clause', () => {
    const { taggedSql } = build({
      '2': [{ id: 'd', column: 'device_type', operator: '=', values: ['Mobile'] }],
    });
    const deviceIdx = taggedSql.indexOf('device_type');
    expect(deviceIdx).toBeGreaterThan(-1);
    expect(deviceIdx).toBeLessThan(taggedSql.indexOf('GROUP BY session_id'));
  });

  it('applies url filters as positional predicates on the untruncated path', () => {
    const { taggedSql } = build({ '2': [urlFilter(['/signup'])] });
    const sliceIdx = taggedSql.indexOf('arraySlice(path');
    const fromIdx = taggedSql.indexOf('FROM session_paths');
    const predicateIdx = taggedSql.indexOf('path[3] ILIKE');
    expect(sliceIdx).toBeGreaterThan(-1);
    expect(sliceIdx).toBeLessThan(fromIdx);
    expect(predicateIdx).toBeGreaterThan(fromIdx);
  });

  it('guards each filtered position against shorter paths', () => {
    const { taggedSql } = build({ '2': [urlFilter(['/signup'])] });
    expect(taggedSql).toContain('length(path) > 2');
  });

  it('combines multiple filters at one position with AND and unique parameters', () => {
    const { taggedSql, taggedParams } = build({
      '1': [urlFilter(['/share/*']), urlFilter(['/share/private'], '!=')],
    });
    expect(taggedSql).toContain('arrayExists(pattern -> path[2] ILIKE pattern, {step_filter_0:Array(String)})');
    expect(taggedSql).toContain('arrayAll(pattern -> path[2] NOT ILIKE pattern, {step_filter_1:Array(String)})');
    expect(taggedParams).toMatchObject({
      step_filter_0: ['/share/%'],
      step_filter_1: ['/share/private'],
    });
  });

  it('emits no positional predicate when no url step filters are set', () => {
    const { taggedSql } = build({
      '1': [{ id: 'd', column: 'device_type', operator: '=', values: ['Mobile'] }],
    });
    expect(taggedSql).not.toMatch(/path\[\d+\] (NOT )?ILIKE/);
  });

  it('treats global property step filters as session-level', () => {
    const { taggedSql } = build({ '1': [{ id: 'g', column: 'gp.plan', operator: '=', values: ['pro'] }] });
    const gpIdx = taggedSql.indexOf('global_properties_keys');
    expect(gpIdx).toBeGreaterThan(-1);
    expect(gpIdx).toBeLessThan(taggedSql.indexOf('GROUP BY session_id'));
  });

  it('keeps global query filters working alongside step filters', () => {
    const { taggedSql } = build({ '0': [urlFilter(['/'])] }, [
      { id: 'q', column: 'browser', operator: '=', values: ['Chrome'] },
    ]);
    expect(taggedSql).toContain('browser ILIKE');
    expect(taggedSql).toContain('path[1] ILIKE');
  });

  it('truncates under a distinct alias so predicates bind the untruncated path', () => {
    const { taggedSql } = build({ '2': [urlFilter(['/signup'])] });
    expect(taggedSql).toContain('AS display_path');
    expect(taggedSql).toContain('GROUP BY display_path');
    expect(taggedSql).not.toMatch(/arraySlice\(path[^)]*\)\s+AS path/);
  });
});
