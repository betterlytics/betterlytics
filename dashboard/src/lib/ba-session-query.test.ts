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

  it('guards the = bridge by event type for primary key pruning', () => {
    const { taggedSql } = buildSubQuery([makeFilter('custom_event_name', '=', ['signup'])]);

    expect(taggedSql).toMatch(/event_type = 'custom' AND arrayExists\(pattern -> custom_event_name ILIKE pattern/);
  });

  it('treats = * on the bridge as "session has such an event"', () => {
    const { taggedSql, taggedParams } = buildSubQuery([makeFilter('custom_event_name', '=', ['*'])]);

    expect(taggedSql).toContain('session_id IN ( SELECT session_id FROM analytics.events');
    expect(taggedSql).toContain(`event_type = 'custom' AND arrayExists`);
    expect(Object.values(taggedParams)).toContainEqual(['%']);
  });

  it('treats = * on session-native columns as "value present"', () => {
    const { taggedSql } = buildSubQuery([makeFilter('utm_source', '=', ['*'])]);

    expect(taggedSql).toContain(`utm_source.2 != ''`);
    expect(taggedSql).not.toContain('analytics.events');
  });

  it('treats != * on session-native columns as "value absent"', () => {
    const { taggedSql } = buildSubQuery([makeFilter('utm_source', '!=', ['*'])]);

    expect(taggedSql).toContain(`utm_source.2 = ''`);
  });

  it('splits = filters on different event types into separate IN bridges', () => {
    const { taggedSql } = buildSubQuery([
      makeFilter('custom_event_name', '=', ['signup'], 'filter-1'),
      makeFilter('outbound_link_url', '=', ['https://example.com*'], 'filter-2'),
    ]);

    expect(taggedSql.match(/session_id IN \( SELECT/g)).toHaveLength(2);
    expect(taggedSql).toMatch(/event_type = 'custom' AND arrayExists\(pattern -> custom_event_name/);
    expect(taggedSql).toMatch(/event_type = 'outbound_link' AND arrayExists\(pattern -> outbound_link_url/);
  });

  it('keeps same-event conjunction for url combined with a guarded column', () => {
    const { taggedSql } = buildSubQuery([
      makeFilter('custom_event_name', '=', ['signup'], 'filter-1'),
      makeFilter('url', '=', ['/pricing'], 'filter-2'),
    ]);

    expect(taggedSql.match(/session_id IN \( SELECT/g)).toHaveLength(1);
    expect(taggedSql).toMatch(/custom_event_name ILIKE pattern.*AND.*arrayExists\(pattern -> url ILIKE pattern/);
  });

  it('keeps gp bare wildcard as session-level key existence', () => {
    const equals = buildSubQuery([makeFilter('gp.plan', '=', ['*'])]);
    const notEquals = buildSubQuery([makeFilter('gp.plan', '!=', ['*'])]);

    expect(equals.taggedSql).toMatch(/arrayExists\(t -> t\.1 = \{gp_key_[0-9a-f]+:String\}, all_props\)/);
    expect(notEquals.taggedSql).toMatch(/NOT arrayExists\(t -> t\.1 = \{gp_key_[0-9a-f]+:String\}, all_props\)/);
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

describe('getSessionTableSubQuery custom event property filters', () => {
  it('bridges = filters through the events IN subquery with a custom event guard', () => {
    const { taggedSql, taggedParams } = buildSubQuery([makeFilter('cep.plan', '=', ['pro'])]);

    expect(taggedSql).toContain('session_id IN ( SELECT session_id FROM analytics.events');
    expect(taggedSql).toMatch(
      /event_type = 'custom' AND arrayExists\(pattern -> JSONExtractString\(custom_event_json, \{cep_key_[0-9a-f]+:String\}\) ILIKE pattern/,
    );
    expect(taggedSql).not.toContain('session_id NOT IN');
    expect(Object.values(taggedParams)).toContainEqual(['pro']);
  });

  it('bridges != filters through the NOT IN subquery with a positive match', () => {
    const { taggedSql, taggedParams } = buildSubQuery([makeFilter('cep.plan', '!=', ['pro'])]);

    expect(taggedSql).toContain('session_id NOT IN ( SELECT session_id FROM analytics.events');
    expect(taggedSql).toMatch(/event_type = 'custom' AND arrayExists\(pattern -> JSONExtractString/);
    expect(taggedSql).not.toContain('NOT ILIKE');
    expect(Object.values(taggedParams)).toContainEqual(['pro']);
  });

  it('treats a lone wildcard as key existence so != * reads "no custom event with the key"', () => {
    const { taggedSql } = buildSubQuery([makeFilter('cep.plan', '!=', ['*'])]);

    expect(taggedSql).toContain('session_id NOT IN');
    expect(taggedSql).toMatch(/event_type = 'custom' AND JSONHas\(custom_event_json, \{cep_key_[0-9a-f]+:String\}\)/);
  });

  it('shares a single IN bridge with event-column = filters so both match the same event', () => {
    const { taggedSql } = buildSubQuery([
      makeFilter('custom_event_name', '=', ['signup'], 'filter-1'),
      makeFilter('cep.plan', '=', ['pro'], 'filter-2'),
    ]);

    expect(taggedSql.match(/SELECT session_id FROM analytics\.events/g)).toHaveLength(1);
    expect(taggedSql).toMatch(/custom_event_name ILIKE pattern.* AND .*JSONExtractString/);
  });

  it('shares a single NOT IN bridge with event-column != filters via OR', () => {
    const { taggedSql } = buildSubQuery([
      makeFilter('custom_event_name', '!=', ['signup'], 'filter-1'),
      makeFilter('cep.plan', '!=', ['pro'], 'filter-2'),
    ]);

    expect(taggedSql.match(/session_id NOT IN/g)).toHaveLength(1);
    expect(taggedSql.match(/SELECT session_id FROM analytics\.events/g)).toHaveLength(1);
    expect(taggedSql).toMatch(/custom_event_name ILIKE pattern.*\) OR \(.*JSONExtractString/);
  });
});

describe('getSessionTableSubQuery literal metacharacters', () => {
  const TYPED = ['plan_pro', '50%off', 'a\\b'];
  const ESCAPED = ['plan\\_pro', '50\\%off', 'a\\\\b'];

  it.each(['=', '!='] as const)('escapes values on event-bridged columns for %s', (operator) => {
    const { taggedParams } = buildSubQuery([makeFilter('custom_event_name', operator, TYPED)]);

    expect(Object.values(taggedParams)).toContainEqual(ESCAPED);
  });

  it.each(['=', '!='] as const)('escapes values on session-native columns for %s', (operator) => {
    const { taggedParams } = buildSubQuery([makeFilter('utm_campaign', operator, TYPED)]);

    expect(Object.values(taggedParams)).toContainEqual(ESCAPED);
  });

  it.each(['=', '!='] as const)('escapes global property values for %s', (operator) => {
    const { taggedParams } = buildSubQuery([makeFilter('gp.plan', operator, TYPED)]);

    expect(Object.values(taggedParams)).toContainEqual(ESCAPED);
  });

  it.each(['=', '!='] as const)('escapes custom event property values for %s', (operator) => {
    const { taggedParams } = buildSubQuery([makeFilter('cep.plan', operator, TYPED)]);

    expect(Object.values(taggedParams)).toContainEqual(ESCAPED);
  });

  it.each(['=', '!='] as const)('treats a lone percent sign as a literal for %s', (operator) => {
    const native = buildSubQuery([makeFilter('utm_source', operator, ['%'])]);
    const gp = buildSubQuery([makeFilter('gp.plan', operator, ['%'])]);
    const cep = buildSubQuery([makeFilter('cep.plan', operator, ['%'])]);

    expect(native.taggedSql).toContain('ILIKE pattern');
    expect(native.taggedSql).not.toMatch(/utm_source\.2 !?= ''/);
    expect(Object.values(native.taggedParams)).toContainEqual(['\\%']);
    expect(gp.taggedSql).toContain('t.2 ILIKE v');
    expect(cep.taggedSql).not.toContain('JSONHas');
  });
});
