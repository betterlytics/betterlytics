import { ClickHouse } from 'clickhouse';
import { env } from '@/lib/env';
import { lazyProxyCache } from '@/lib/lazy-cache';

export const clickhouse = lazyProxyCache(() => {
  return new ClickHouse({
    url: env.CLICKHOUSE_URL,
    user: env.CLICKHOUSE_DASHBOARD_USER,
    password: env.CLICKHOUSE_DASHBOARD_PASSWORD,
    isUseGzip: false,
    format: 'json',
  });
});
