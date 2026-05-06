import { createClickHouseAdapter, type ClickHouseAdapterClient } from '@/lib/clickhouseAdapter';
import { workerEnv } from '@/worker/workerEnv';

let _writeClient: ClickHouseAdapterClient | null = null;

export function getWorkerClickHouseClient(): ClickHouseAdapterClient {
  if (_writeClient) return _writeClient;

  _writeClient = createClickHouseAdapter({
    url: workerEnv.CLICKHOUSE_URL,
    username: workerEnv.WORKER_CLICKHOUSE_WRITE_USER,
    password: workerEnv.WORKER_CLICKHOUSE_WRITE_PASSWORD,
  });

  return _writeClient;
}
