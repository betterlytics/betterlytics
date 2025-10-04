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
) {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);

  return getSessionReplays(siteId, formattedStart, formattedEnd, queryFilters);
}

const s3Repository = new S3ReplaySegmentsRepository();

export async function getReplaySegmentManifest(prefix: string, ttlSeconds = 300): Promise<ReplaySegmentManifest> {
  return s3Repository.listAndPresign(prefix, ttlSeconds);
}
