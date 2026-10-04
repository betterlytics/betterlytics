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

export const MAX_REPLAY_STREAMS_PER_PROCESS = 24;

const baseClient = createClickHouseAdapter({
  url: env.CLICKHOUSE_URL,
  username: env.CLICKHOUSE_DASHBOARD_USER,
  password: env.CLICKHOUSE_DASHBOARD_PASSWORD,
  streamMaxOpenConnections: MAX_REPLAY_STREAMS_PER_PROCESS,
});

export const clickhouse = withConcurrencyLimiter(instrumentClickHouse(baseClient, { dbName: 'default' }));
