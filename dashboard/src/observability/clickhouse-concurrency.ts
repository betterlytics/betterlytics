import type { ClickHouseAdapterClient, QueryCursorLike, AdapterQueryOptions } from '@/lib/clickhouse';

type QueueEntry = {
  resolve: () => void;
};

type SiteLimiter = {
  limit: number;
  running: number;
  queue: QueueEntry[];
};

const limiters = new Map<string, SiteLimiter>();

export function setSiteConcurrencyLimit(siteId: string, limit: number) {
  const existing = limiters.get(siteId);
  if (existing) {
    existing.limit = limit;
    return;
  }
  limiters.set(siteId, { limit, running: 0, queue: [] });
}

async function withConcurrencyLimit<T>(siteId: string, fn: () => Promise<T>): Promise<T> {
  const limiter = limiters.get(siteId);
  if (!limiter) return fn();

  if (limiter.running < limiter.limit) {
    limiter.running++;
  } else {
    await new Promise<void>((resolve) => {
      limiter.queue.push({ resolve });
    });
  }

  try {
    return await fn();
  } finally {
    limiter.running--;
    const next = limiter.queue.shift();
    if (next) {
      limiter.running++;
      next.resolve();
    }
  }
}

export function withConcurrencyLimiter<T extends ClickHouseAdapterClient>(client: T): T {
  return new Proxy(client, {
    get(target, prop, receiver) {
      if (prop === 'query') {
        return function (sql: string, reqParams?: AdapterQueryOptions): QueryCursorLike {
          const siteId = (reqParams?.params?.site_id ?? reqParams?.params?.siteId) as string | undefined;
          const cursor = (target.query as T['query']).call(target, sql, reqParams) as QueryCursorLike;

          if (!siteId || !limiters.has(siteId)) return cursor;

          return {
            async toPromise(): Promise<unknown[]> {
              return withConcurrencyLimit(siteId, () => cursor.toPromise());
            },
          };
        };
      }

      return Reflect.get(target, prop, receiver);
    },
  }) as T;
}
