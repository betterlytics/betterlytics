'server-only';

import { getSessionReplays } from '@/repositories/clickhouse/index.repository';
import { S3ReplaySegmentsRepository } from '@/repositories/s3ReplaySegmentsRepository';
import type { ReplaySegmentManifest } from '@/entities/analytics/sessionReplays.entities';
import { BASiteQuery } from '@/entities/analytics/analyticsQuery.entities';

export async function getSessionReplaysForSite(siteQuery: BASiteQuery, limit: number, offset: number) {
  return getSessionReplays(siteQuery, limit, offset);
}

const s3Repository = new S3ReplaySegmentsRepository();

export async function getReplaySegmentManifest(
  prefix: string,
  ttlSeconds = 300,
  cutoffIso?: Date,
): Promise<ReplaySegmentManifest> {
  const manifest = await s3Repository.listAndPresign(prefix, ttlSeconds);

  if (!cutoffIso) return manifest;

  const cutoff = cutoffIso.getTime() + 1_000; // +1 second to account for duration flooring

  if (Number.isNaN(cutoff)) return manifest;

  return filterManifestByCutoff(manifest, cutoff);
}

function filterManifestByCutoff(manifest: ReplaySegmentManifest, cutoff: number): ReplaySegmentManifest {
  return manifest
    .map((manifest) => {
      const epoch = extractEpochFromKey(manifest.key);
      return epoch ? { ...manifest, epoch } : null;
    })
    .filter((manifest) => manifest !== null)
    .sort((a, b) => a.epoch - b.epoch)
    .filter((manifest) => manifest.epoch <= cutoff);
}

function extractEpochFromKey(key: string): number | null {
  const filename = key.split('/').pop();
  if (!filename) return null;

  const epochStr = filename.split('-')[0];
  return /^\d{13}$/.test(epochStr) ? Number(epochStr) : null;
}
