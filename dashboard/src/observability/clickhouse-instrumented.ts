import { trace, SpanStatusCode } from '@opentelemetry/api';
import { env } from '@/lib/env';

type QueryCursorLike = {
  toPromise: () => Promise<unknown>;
};

type ClickHouseClientLike = {
  query: (sql: string, reqParams?: Record<string, unknown>) => QueryCursorLike;
};

const tracer = trace.getTracer('dashboard');

function sanitizeStatement(statement: string, maxLength: number = 2000): string {
  const condensed = statement.replace(/\s+/g, ' ').trim();
  return condensed.length > maxLength ? condensed.slice(0, maxLength) : condensed;
}

function inferOperation(statement: string): string {
  const firstWord = statement.trim().split(/\s+/)[0]?.toUpperCase();
  switch (firstWord) {
    case 'SELECT':
    case 'INSERT':
    case 'UPDATE':
    case 'DELETE':
    case 'CREATE':
    case 'ALTER':
      return firstWord;
    default:
      return 'QUERY';
  }
}

export function instrumentClickHouse<T extends ClickHouseClientLike>(client: T, options?: { dbName?: string }): T {
  if (!env.ENABLE_MONITORING) return client;

  const dbName = options?.dbName ?? 'default';

  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === 'query') {
        return function <R = unknown>(sql: string, reqParams?: Record<string, unknown>): QueryCursorLike {
          const statement = sql;
          const operation = inferOperation(statement);
          const sanitized = sanitizeStatement(statement);

          const cursor = (target.query as T['query']).call(target, sql, reqParams) as QueryCursorLike;

          // Wrap toPromise so existing callsites remain unchanged
          return {
            toPromise: async (): Promise<R> =>
              tracer.startActiveSpan(`db.clickhouse.${operation.toLowerCase()}`, async (span) => {
                span.setAttributes({
                  'db.system': 'clickhouse',
                  'db.operation': operation,
                  'db.name': dbName,
                  'db.statement': sanitized,
                });
                try {
                  const out = await cursor.toPromise();
                  span.setStatus({ code: SpanStatusCode.OK });
                  return out as R;
                } catch (e) {
                  const err = e as Error;
                  span.recordException(err);
                  span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
                  throw err;
                } finally {
                  span.end();
                }
              }),
          };
        };
      }

      return Reflect.get(target, prop, receiver);
    },
  }) as T;
}
