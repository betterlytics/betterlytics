'server-only';

import { env } from '@/lib/env';
import { createClient, type RedisClientType } from 'redis';

let client: RedisClientType | undefined;

const DEFAULT_REDIS_BEST_EFFORT_TIMEOUT_MS = 500;

export function getRedisClient(): RedisClientType {
  if (!client) {
    client = createClient({
      url: env.REDIS_URL,
      socket: {
        connectTimeout: 1000,
        reconnectStrategy: (retries) => Math.min(retries * 50, 1000),
      },
    });
    client.on('error', (err) => {
      console.error('Redis Client Error', err);
    });
  }
  return client;
}

export async function ensureRedisConnected(): Promise<void> {
  const c = getRedisClient();
  if (!c.isOpen) {
    await c.connect();
  }
}

type RedisBestEffortOptions = {
  timeoutMs?: number;
  label?: string;
};

export async function runRedisBestEffort<T>(
  op: () => Promise<T>,
  options?: RedisBestEffortOptions,
): Promise<T | null> {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_REDIS_BEST_EFFORT_TIMEOUT_MS;
  const label = options?.label ?? 'redis';

  let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<null>((resolve) => {
    timeoutHandle = setTimeout(() => {
      console.warn(`Redis best-effort timed out after ${timeoutMs}ms (${label})`);
      resolve(null);
    }, timeoutMs);
  });

  const opPromise: Promise<T | null> = op()
    .then((value) => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
      return value;
    })
    .catch((err) => {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
      console.error(`Redis best-effort error (${label})`, err);
      return null;
    });

  const result = await Promise.race<T | null>([opPromise, timeoutPromise]);
  return result;
}
