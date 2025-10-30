'server-only';

import { env } from '@/lib/env';
import { createClient, type RedisClientType } from 'redis';

let client: RedisClientType | undefined;

export function getRedisClient(): RedisClientType {
  if (!client) {
    client = createClient({ url: env.REDIS_URL });
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
