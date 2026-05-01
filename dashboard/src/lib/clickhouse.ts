import { env } from './env';
import { instrumentClickHouse } from '@/observability/clickhouse-instrumented';
import { withConcurrencyLimiter } from '@/observability/clickhouse-concurrency';
import {
  createClickHouseAdapter,
  type AdapterQueryOptions,
  type ClickHouseAdapterClient,
  type QueryCursorLike,
} from './clickhouseAdapter';

export { createClickHouseAdapter, type AdapterQueryOptions, type ClickHouseAdapterClient, type QueryCursorLike };

const baseClient = createClickHouseAdapter({
  url: env.CLICKHOUSE_URL,
  username: env.CLICKHOUSE_DASHBOARD_USER,
  password: env.CLICKHOUSE_DASHBOARD_PASSWORD,
});

export const clickhouse = withConcurrencyLimiter(instrumentClickHouse(baseClient, { dbName: 'default' }));
