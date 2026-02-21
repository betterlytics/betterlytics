import { createClient, type ClickHouseClient } from '@clickhouse/client';
import { env } from './env';
import { instrumentClickHouse } from '@/observability/clickhouse-instrumented';

type SupportedFormat = 'JSONEachRow' | 'JSON' | 'CSV' | 'TSV';

interface AdapterQueryOptions {
  params?: Record<string, unknown>;
  format?: SupportedFormat;
}

export interface QueryCursorLike {
  toPromise: () => Promise<Record<string, unknown>[]>;
}

export interface ClickHouseAdapterClient {
  query: (sql: string, reqParams?: AdapterQueryOptions) => QueryCursorLike;
}

interface AdapterConfig {
  url: string;
  username: string;
  password: string;
}

export function createClickHouseAdapter(config: AdapterConfig): ClickHouseAdapterClient {
  const client: ClickHouseClient = createClient({
    url: config.url,
    username: config.username,
    password: config.password,
    request_timeout: 30_000,
    compression: {
      request: false,
      response: false,
    },
  });

  return {
    query(sql: string, reqParams?: AdapterQueryOptions): QueryCursorLike {
      const params = reqParams?.params ?? {};
      // Default to JSONEachRow: the old `clickhouse` package used format:'json'
      // but stripped the JSON envelope internally. JSONEachRow gives us the flat
      // row array directly, preserving the same caller-facing behavior.
      const format = reqParams?.format ?? 'JSONEachRow';

      return {
        async toPromise(): Promise<Record<string, unknown>[]> {
          const resultSet = await client.query({
            query: sql,
            query_params: params,
            format,
          });
          return resultSet.json<Record<string, unknown>>();
        },
      };
    },
  };
}

const baseClient = createClickHouseAdapter({
  url: env.CLICKHOUSE_URL,
  username: env.CLICKHOUSE_DASHBOARD_USER,
  password: env.CLICKHOUSE_DASHBOARD_PASSWORD,
});

export const clickhouse = instrumentClickHouse(baseClient, { dbName: 'default' });
