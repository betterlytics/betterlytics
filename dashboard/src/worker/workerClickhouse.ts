import { createClickHouseAdapter, type ClickHouseAdapterClient } from '@/lib/clickhouseAdapter';
import { workerEnv } from '@/lib/env/worker.env';
import { instrumentClickHouse } from '@/observability/clickhouse-instrumented';

let _writeClient: ClickHouseAdapterClient | null = null;

export function getWorkerClickHouseClient(): ClickHouseAdapterClient {
  if (_writeClient) return _writeClient;

  _writeClient = instrumentClickHouse(
    createClickHouseAdapter({
      url: workerEnv.CLICKHOUSE_URL,
      username: workerEnv.WORKER_CLICKHOUSE_WRITE_USER,
      password: workerEnv.WORKER_CLICKHOUSE_WRITE_PASSWORD,
    }),
  );

  return _writeClient;
}
