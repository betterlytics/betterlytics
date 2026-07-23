import { describe, it, expect } from 'vitest';
import { BASessionQuery } from './ba-session-query';
import type { QueryFilter } from '@/entities/analytics/filter.entities';

const SITE_ID = 'test-site';
const START = '2026-01-01 00:00:00';
const END = '2026-01-31 23:59:59';

function buildSubQuery(filters: QueryFilter[]) {
  return BASessionQuery.getSessionTableSubQuery(['visitor_id'], filters, SITE_ID, START, END);
}

function makeFilter(
  column: QueryFilter['column'],
  operator: QueryFilter['operator'],
  values: string[],
  id = 'filter-1',
): QueryFilter {
  return { id, column, operator, values };
}

describe('getSessionTableSubQuery event-column filters', () => {
  it('bridges = filters through a session_id IN subquery on analytics.events', () => {
    const { taggedSql } = buildSubQuery([makeFilter('custom_event_name', '=', ['signup'])]);

    expect(taggedSql).toContain('session_id IN ( SELECT session_id FROM analytics.events');
    expect(taggedSql).toMatch(/arrayExists\(pattern -> custom_event_name ILIKE pattern, \{query_filter_[0-9a-f]+:Array\(String\)\}\)/);
    expect(taggedSql).not.toContain('session_id NOT IN');
  });

  it('bridges != filters through a session_id NOT IN subquery with a positive match', () => {
    const { taggedSql, taggedParams } = buildSubQuery([makeFilter('custom_event_name', '!=', ['signup'])]);

    expect(taggedSql).toContain('session_id NOT IN ( SELECT session_id FROM analytics.events');
    expect(taggedSql).toMatch(/arrayExists\(pattern -> custom_event_name ILIKE pattern/);
    expect(taggedSql).not.toContain('NOT ILIKE');
    expect(Object.values(taggedParams)).toContainEqual(['signup']);
  });

  it('guards the != bridge by event type so wildcards read "no such event"', () => {
    const { taggedSql, taggedParams } = buildSubQuery([makeFilter('custom_event_name', '!=', ['*'])]);

    expect(taggedSql).toContain(`event_type = 'custom' AND arrayExists`);
    expect(Object.values(taggedParams)).toContainEqual(['%']);
  });

  it('guards outbound_link_url by its event type and leaves url unguarded', () => {
    const { taggedSql } = buildSubQuery([
      makeFilter('outbound_link_url', '!=', ['https://example.com*'], 'filter-1'),
      makeFilter('url', '!=', ['/pricing'], 'filter-2'),
    ]);

    expect(taggedSql).toContain(`event_type = 'outbound_link' AND arrayExists`);
    expect(taggedSql).not.toMatch(/event_type = \S+ AND arrayExists\(pattern -> url/);
  });

  it('splits mixed operators into separate IN and NOT IN bridges', () => {
    const { taggedSql } = buildSubQuery([
      makeFilter('url', '=', ['/pricing'], 'filter-1'),
      makeFilter('custom_event_name', '!=', ['signup'], 'filter-2'),
    ]);

    const [inBridge, notInBridge] = taggedSql.split('session_id NOT IN');
    expect(inBridge).toContain('session_id IN ( SELECT session_id FROM analytics.events');
    expect(inBridge).toMatch(/arrayExists\(pattern -> url ILIKE pattern/);
    expect(notInBridge).toMatch(/arrayExists\(pattern -> custom_event_name ILIKE pattern/);
  });

  it('combines multiple != filters into a single NOT IN bridge with OR', () => {
    const { taggedSql } = buildSubQuery([
      makeFilter('custom_event_name', '!=', ['signup'], 'filter-1'),
      makeFilter('outbound_link_url', '!=', ['https://example.com*'], 'filter-2'),
    ]);

    expect(taggedSql.match(/session_id NOT IN/g)).toHaveLength(1);
    expect(taggedSql).toMatch(/custom_event_name ILIKE pattern.*\) OR \(.*outbound_link_url ILIKE pattern/);
  });

  it('keeps != on session-native columns as an inline per-session predicate', () => {
    const { taggedSql } = buildSubQuery([makeFilter('device_type', '!=', ['mobile'])]);

    expect(taggedSql).toContain('arrayAll(pattern -> device_type NOT ILIKE pattern');
    expect(taggedSql).not.toContain('analytics.events');
  });

  it('keeps != on global properties as a session-level NOT arrayExists', () => {
    const { taggedSql } = buildSubQuery([makeFilter('gp.plan', '!=', ['pro'])]);

    expect(taggedSql).toContain('NOT arrayExists');
    expect(taggedSql).not.toContain('analytics.events');
  });
});
