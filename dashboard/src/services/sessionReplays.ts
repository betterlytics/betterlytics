'server-only';

import { getSessionReplays } from '@/repositories/clickhouse';
import { toDateTimeString } from '@/utils/dateFormatters';
import { S3ReplaySegmentsRepository } from '@/repositories/s3ReplaySegmentsRepository';

export async function getSessionReplaysForSite(siteId: string, startDate: Date, endDate: Date) {
  const formattedStart = toDateTimeString(startDate);
  const formattedEnd = toDateTimeString(endDate);

  return getSessionReplays(siteId, formattedStart, formattedEnd);
}

const s3Repository = new S3ReplaySegmentsRepository();

export async function getSignedReplaySegments(prefix: string, ttlSeconds = 300) {
  return s3Repository.listAndPresign(prefix, ttlSeconds);
}
