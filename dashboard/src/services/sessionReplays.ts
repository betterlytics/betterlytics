'server-only';

import { getSessionReplays } from '@/repositories/clickhouse';
import { toDateTimeString } from '@/utils/dateFormatters';
import { S3ReplaySegmentsRepository } from '@/repositories/s3ReplaySegmentsRepository';
import type { ReplaySegmentManifest } from '@/entities/sessionReplays';
import type { QueryFilter } from '@/entities/filter';

export async function getSessionReplaysForSite(
  siteId: string,
  startDate: Date,
  endDate: Date,
  queryFilters: QueryFilter[],
  limit: number,
  offset: number,
) {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);

  return getSessionReplays(siteId, formattedStart, formattedEnd, queryFilters, limit, offset);
}

const s3Repository = new S3ReplaySegmentsRepository();

export async function getReplaySegmentManifest(
  prefix: string,
  ttlSeconds = 300,
  cutoffIso?: string,
): Promise<ReplaySegmentManifest> {
  const manifest = await s3Repository.listAndPresign(prefix, ttlSeconds);

  if (!cutoffIso) return manifest;

  const cutoff = Date.parse(cutoffIso.replace(' ', 'T') + 'Z') + 2_000;

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
