import 'server-only';

import { safeSql, type SQLTaggedExpression } from './safe-sql';
import type { PropertySourceKind } from '@/entities/analytics/propertySources';

type PropertySqlLeaf = {
  hasKey: (keySql: SQLTaggedExpression) => SQLTaggedExpression;
  extractValue: (keySql: SQLTaggedExpression) => SQLTaggedExpression;
};

/* Per-source SQL for discovering a source's keys and values off analytics.events. */
type PropertyDiscovery = {
  keysSelectExpr: SQLTaggedExpression;
  hasAnyKey: SQLTaggedExpression;
  eventScopeClause: SQLTaggedExpression;
  sampleValues: boolean;
};

type PropertyDescriptor = {
  sql: PropertySqlLeaf;
  discovery: PropertyDiscovery;
};

/**
 * The per-source seam. gp reads the parallel global_properties_* arrays; cep reads
 * the custom_event_json blob (verified on CH 25.8 to uniformly stringify scalars
 * and return '' for missing). Adding a source is one row here.
 */
export const PROPERTY_SQL: Record<PropertySourceKind, PropertyDescriptor> = {
  gp: {
    sql: {
      hasKey: (key) => safeSql`has(global_properties_keys, ${key})`,
      extractValue: (key) => safeSql`global_properties_values[indexOf(global_properties_keys, ${key})]`,
    },
    discovery: {
      keysSelectExpr: safeSql`arrayJoin(global_properties_keys)`,
      hasAnyKey: safeSql`notEmpty(global_properties_keys)`,
      eventScopeClause: safeSql``,
      sampleValues: false,
    },
  },
  cep: {
    sql: {
      hasKey: (key) => safeSql`JSONHas(custom_event_json, ${key})`,
      extractValue: (key) => safeSql`JSONExtractString(custom_event_json, ${key})`,
    },
    discovery: {
      keysSelectExpr: safeSql`arrayJoin(JSONExtractKeys(custom_event_json))`,
      hasAnyKey: safeSql`custom_event_json != '{}'`,
      eventScopeClause: safeSql`AND event_type = 'custom'`,
      sampleValues: true,
    },
  },
};

type PropertyFilterArgs = {
  keySql: SQLTaggedExpression;
  valuesSql: SQLTaggedExpression;
  values: string[];
  operator: { quantifier: SQLTaggedExpression; operater: SQLTaggedExpression };
  rawOperator: '=' | '!=';
};

/**
 * WHERE fragment for a property filter, shared by the events and session query
 * builders. A single `%` value means "key exists".
 */
export function buildPropertyFilterSql(source: PropertySourceKind, args: PropertyFilterArgs): SQLTaggedExpression {
  const leaf = PROPERTY_SQL[source].sql;
  const isWildcard = args.values.length === 1 && args.values[0] === '%';
  if (isWildcard) {
    const hasKey = leaf.hasKey(args.keySql);
    return args.rawOperator === '=' ? hasKey : safeSql`NOT ${hasKey}`;
  }
  const extract = leaf.extractValue(args.keySql);
  return safeSql`${args.operator.quantifier}(pattern -> ${extract} ${args.operator.operater} pattern, ${args.valuesSql})`;
}
