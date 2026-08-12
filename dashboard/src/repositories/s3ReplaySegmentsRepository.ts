import 'server-only';

import { ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Client, getS3DataPlaneClient } from '@/lib/s3-client';
import { s3Env } from '@/lib/env';
import type { ReplaySegmentManifestEntry } from '@/entities/analytics/sessionReplays.entities';

export class S3ReplaySegmentsRepository {
  async listAndPresign(prefix: string, ttlSeconds = 60): Promise<ReplaySegmentManifestEntry[]> {
    if (!s3Env.enabled) {
      throw new Error('S3 is disabled');
    }

    if (!s3Env.bucket) {
      throw new Error('S3 bucket is not configured');
    }

    const dataPlaneClient = getS3DataPlaneClient();
    const presignClient = getS3Client();

    const listCommand = new ListObjectsV2Command({
      Bucket: s3Env.bucket,
      Prefix: prefix,
    });

    const listed = await dataPlaneClient.send(listCommand);
    const contents = (listed.Contents ?? []).filter(
      (obj): obj is { Key: string; Size?: number; LastModified?: Date } => Boolean(obj.Key),
    );

    contents.sort((a, b) => a.Key.localeCompare(b.Key));

    const segments = await Promise.all(
      contents.map(async ({ Key, Size, LastModified }) => {
        const command = new GetObjectCommand({
          Bucket: s3Env.bucket,
          Key,
        });

        const url = await getSignedUrl(presignClient, command, { expiresIn: ttlSeconds });
        const entry: ReplaySegmentManifestEntry = {
          key: Key,
          url,
          sizeBytes: Size ?? 0,
          ...(LastModified ? { lastModified: LastModified.toISOString() } : {}),
        };
        return entry;
      }),
    );

    return segments;
  }
}
