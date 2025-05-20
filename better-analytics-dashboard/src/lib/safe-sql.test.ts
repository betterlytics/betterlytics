import { describe, it, expect } from 'vitest'
import { SQL, safeSql } from './safe-sql';

describe("SafeSQL tests", () => {
  it(
    "returns empty string and object on no input",
    () => {
      const expected = {
        taggedSql: '',
        taggedParams: {}
      };
      
      const actual = safeSql``;

      expect(actual.taggedSql).toBe(expected.taggedSql);
      expect(actual.taggedParams).toEqual(expected.taggedParams);
    }
  );

  it(
    "returns the raw SQL if no parameters are passed",
    () => {
      const expected = {
        taggedSql: 'SELECT uniq(visitor_id) FROM analytics.events',
        taggedParams: {}
      };
      
      const actual = safeSql`SELECT uniq(visitor_id) FROM analytics.events`;

      expect(actual.taggedSql).toBe(expected.taggedSql);
      expect(actual.taggedParams).toEqual(expected.taggedParams);
    }
  );

  it(
    "returns the tagged SQL when parameters are sent",
    () => {
      const expected = {
        taggedSql: 'SELECT uniq(visitor_id) FROM analytics.events WHERE site_id = {site_id:String}',
        taggedParams: {
          site_id: 'test'
        }
      };
      
      const actual = safeSql`SELECT uniq(visitor_id) FROM analytics.events WHERE site_id = ${SQL.String({ site_id: 'test' })}`;

      expect(actual.taggedSql).toBe(expected.taggedSql);
      expect(actual.taggedParams).toEqual(expected.taggedParams);
    }
  );

  it(
    "correctly returns recursively used safeSql",
    () => {
      const expected = {
        taggedSql: 'SELECT uniq(visitor_id) FROM analytics.events WHERE site_id = {site_id:String} AND event_type = {event_type:String}',
        taggedParams: {
          site_id: 'test',
          event_type: 'custom'
        }
      };
      
      const actual = safeSql`SELECT uniq(visitor_id) FROM analytics.events WHERE ${safeSql`site_id = ${SQL.String({ site_id: 'test' })} AND event_type = ${SQL.String({ event_type: 'custom' })}`}`;

      expect(actual.taggedSql).toBe(expected.taggedSql);
      expect(actual.taggedParams).toEqual(expected.taggedParams);
    }
  );

  it(
    "returns correct values using list helper",
    () => {
      const expected = {
        taggedSql: 'SELECT uniq(visitor_id) FROM analytics.events WHERE url = {page_0:String} OR url = {page_1:String} OR url = {page_2:String}',
        taggedParams: {
          page_0: 'a',
          page_1: 'b',
          page_2: 'c',
        }
      };
      
      const pages = ['a', 'b', 'c'];
      const taggedSqlResponse = pages
        .map((page, index) => SQL.String({ [`page_${index}`]: page }))
        .map((page) => safeSql`url = ${page}`);

      const actual = safeSql`SELECT uniq(visitor_id) FROM analytics.events WHERE ${SQL.OR(taggedSqlResponse)}`;

      expect(actual.taggedSql).toBe(expected.taggedSql);
      expect(actual.taggedParams).toEqual(expected.taggedParams);
    }
  );
});
