'use server';
import { ensureRedisConnected, getRedisClient } from '@/lib/redis';
import type { SiteConfig } from '@/entities/siteConfig';
import { z } from 'zod';

const CONFIG_KEY = (siteId: string) => `site:cfg:${siteId}`;
const CONFIG_CHANNEL = 'site_cfg_updates';

const RedisSiteConfigPayload = z
  .object({
    siteId: z.string(),
    blacklistedIps: z.array(z.string()),
    enforceDomain: z.boolean(),
    domain: z.string(),
    updatedAt: z.string(),
    version: z.number(),
  })
  .strict();

export async function writeConfigToRedis(siteId: string, config: SiteConfig, domain: string): Promise<void> {
  await ensureRedisConnected();
  const client = getRedisClient();
  const data = {
    siteId,
    blacklistedIps: config.blacklistedIps,
    enforceDomain: config.enforceDomain,
    domain,
    updatedAt: config.updatedAt.toISOString(),
    version: Number(config.updatedAt),
  };
  const validated = RedisSiteConfigPayload.parse(data);
  await client.set(CONFIG_KEY(siteId), JSON.stringify(validated));
}

export async function publishConfigInvalidation(siteId: string, version?: number): Promise<void> {
  await ensureRedisConnected();
  const client = getRedisClient();
  const message = JSON.stringify({ site_id: siteId, version });
  await client.publish(CONFIG_CHANNEL, message);
}

export async function writeConfigsBatch(
  items: Array<{
    siteId: string;
    domain: string;
    config: { blacklistedIps: string[]; enforceDomain: boolean; updatedAt: Date } | null;
  }>,
): Promise<number> {
  if (items.length === 0) return 0;
  await ensureRedisConnected();
  const client = getRedisClient();
  const pipeline = client.multi();

  let count = 0;
  for (const item of items) {
    if (!item.config) continue;
    const payload = RedisSiteConfigPayload.parse({
      siteId: item.siteId,
      blacklistedIps: item.config.blacklistedIps,
      enforceDomain: item.config.enforceDomain,
      domain: item.domain,
      updatedAt: item.config.updatedAt.toISOString(),
      version: Number(item.config.updatedAt),
    });
    pipeline.set(CONFIG_KEY(item.siteId), JSON.stringify(payload));
    count++;
  }

  await pipeline.exec();
  return count;
}
