/**
 * Tag SQL with parameters safely:\
 * Use the premade `SQL.*` functions to to add variables and parameters.\
 * Note - each function `SQL.*` takes an object with a key of the variable name, and the value as the expression.\
 * Usage:
 * ```ts
 * // Create the SQL query
 * const { taggedSql, taggedParams } = safeSql`
 *   SELECT uniq(visitor_id)
 *   FROM analytics.events
 *   WHERE site_id = ${SQL.String({ siteId })}
 * `;
 *
 * // Use it to query with
 * const result = await clickhouse.query(
 *   taggedSql,
 *   { params: taggedParams }
 * );
 * ```
 *
 * You can easily mix it with regular variables.\
 * This way, you don't have to do everything using the custom functions.
 * ```ts
 * // Create the SQL query with mixture
 * const { taggedSql, taggedParams } = safeSql`
 *   SELECT uniq(visitor_id)
 *   FROM analytics.events
 *   WHERE site_id = ${String({ siteId })}
 *     AND timestamp BETWEEN {start_date:DateTime} AND {end_date:DateTime}
 * `;
 *
 * // Use it to query with - remeber to add custom variables to params
 * const result = await clickhouse.query(
 *   taggedSql,
 *   {
 *     params: {
 *       ...taggedParams,
 *       // Custom variables
 *       start_date: startDate,
 *       end_date: endDate
 *     }
 *   }
 * );
 *
 * You can also use list helpers like `SQL.AND([])` or `SQL.SEPARATOR([])`.\
 * So if you map over a list of filters, for instance:
 * ```ts
 * const siteFilters = sites
 *   .map((site, index) => SQL.String({ [`site_${index}`]: site }))
 *   .map((site) => safeSql`site_id = ${site}`);
 *
 * // Create the SQL from sub-tags
 * const { taggedSql, taggedParams } = safeSql`
 *   SELECT uniq(visitor_id)
 *   FROM analytics.events
 *   WHERE ${SQL.OR(siteFilters)};
 * `;
 *
 * // Use it to query with - remeber to add custom variables to params
 * const result = await clickhouse.query(
 *   taggedSql,
 *   { params: taggedParams }
 * );
 */
export function safeSql<T extends SQLTaggedExpression[]>(
  template: TemplateStringsArray,
  ...variables: T
): SQLTaggedExpression {
  return template.reduce(
    (acc, current, index) => {
      const taggedSql = `${acc.taggedSql}${current}`;
      const variable = variables[index];

      // Handle final condition - length of "template" is always 1 larger than "variables"
      if (!variable) {
        return { ...acc, taggedSql };
      }

      return {
        taggedSql: `${taggedSql}${variable.taggedSql}`,
        taggedParams: {
          ...acc.taggedParams,
          ...variable.taggedParams,
        },
      };
    },
    { taggedSql: '', taggedParams: {} as Record<string, unknown> },
  );
}

export const SQL = {
  // "Primitives"
  String: asType<string>('String'),
  UInt32: asType<number>('UInt32'),
  DateTime: asType<string>('DateTime'),
  UInt32Array: asType<Array<number>>('Array(UInt32)'),
  StringArray: asType<Array<string>>('Array(String)'),

  /**
   * WARNING - THIS WILL FORCE INJECT THE GIVEN STRING INTO THE FINAL SQL. USE WITH GREAT CARE.\
   * ZOD VALIDATE BEFORE USING THIS TO PREVENT SQL INJECTION.\
   * Note - remember to add "extras" manually, such as quotation marks around strings, etc.
   */
  Unsafe: unsafeAsRawSQL(),

  // List helpers
  AND: asJoin(' AND '),
  OR: asJoin(' OR '),
  SEPARATOR: asJoin(', '),
} as const;

function asJoin(kind: string): (expressions: SQLTaggedExpression[]) => SQLTaggedExpression {
  return (expressions: SQLTaggedExpression[]) => {
    const taggedSql = expressions.map((expression) => expression.taggedSql).join(kind);

    const taggedParams = expressions.reduce(
      (acc, curr) => ({ ...acc, ...curr.taggedParams }),
      {} as SQLTaggedExpression['taggedParams'],
    );

    return { taggedSql, taggedParams };
  };
}

function asType<T>(kind: string): (variable: SQLVariable<T>) => SQLTaggedExpression {
  return (variable) => {
    const [name] = Object.keys(variable);
    const expression = variable[name];

    const taggedSql = `{${name}:${kind}}`;
    return {
      taggedSql,
      taggedParams: {
        [name]: expression,
      },
    };
  };
}

function unsafeAsRawSQL(): (unsafeSql: string) => SQLTaggedExpression {
  return (unsafeSql) => {
    return {
      taggedSql: unsafeSql,
      taggedParams: {},
    };
  };
}

type SQLVariable<T> = {
  [param: string]: T;
};

type SQLTaggedExpression = {
  taggedSql: string;
  taggedParams: Record<string, unknown>;
};
