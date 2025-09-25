'server-only';

import { ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getS3Client } from '@/lib/s3-client';
import { s3Env } from '@/lib/env';

export type PresignedReplaySegment = {
  key: string;
  url: string;
};

export class S3ReplaySegmentsRepository {
  async listAndPresign(prefix: string, ttlSeconds = 60): Promise<PresignedReplaySegment[]> {
    if (!s3Env.enabled) {
      throw new Error('S3 is disabled');
    }

    if (!s3Env.bucket) {
      throw new Error('S3 bucket is not configured');
    }

    const client = getS3Client();

    const listCommand = new ListObjectsV2Command({
      Bucket: s3Env.bucket,
      Prefix: prefix,
    });

    const listed = await client.send(listCommand);
    const contents = (listed.Contents ?? []).filter((obj): obj is { Key: string } => Boolean(obj.Key));

    contents.sort((a, b) => a.Key.localeCompare(b.Key));

    const segments = await Promise.all(
      contents.map(async ({ Key }) => {
        const command = new GetObjectCommand({
          Bucket: s3Env.bucket,
          Key,
        });

        const url = await getSignedUrl(client, command, { expiresIn: ttlSeconds });
        return { key: Key, url } satisfies PresignedReplaySegment;
      }),
    );

    return segments;
  }
}
