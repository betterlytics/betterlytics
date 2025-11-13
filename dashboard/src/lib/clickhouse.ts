import { ClickHouse } from 'clickhouse';
import { env } from './env';
import { instrumentClickHouse } from '@/observability/clickhouse-instrumented';

const baseClient = new ClickHouse({
  url: env.CLICKHOUSE_URL,
  user: env.CLICKHOUSE_DASHBOARD_USER,
  password: env.CLICKHOUSE_DASHBOARD_PASSWORD,
  isUseGzip: false,
  format: 'json',
});

export const clickhouse = instrumentClickHouse(baseClient, { dbName: 'default' });
