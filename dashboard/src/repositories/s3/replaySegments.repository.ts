import 'server-only';

import { ListObjectsV2Command, GetObjectCommand, NoSuchKey } from '@aws-sdk/client-s3';
import { getS3Client } from '@/lib/s3-client';
import { s3Env } from '@/lib/env';
import type { ReplaySegmentReader } from '../replaySegments.repository';

function segmentPrefix(siteId: string, sessionId: string): string {
  return `site/${siteId}/sess/${sessionId}/`;
}

function getBucket(): string {
  if (!s3Env.bucket) {
    throw new Error('S3 bucket is not configured');
  }
  return s3Env.bucket;
}

export const s3SegmentReader: ReplaySegmentReader = {
  async list(siteId, sessionId) {
    const listed = await getS3Client().send(
      new ListObjectsV2Command({
        Bucket: getBucket(),
        Prefix: segmentPrefix(siteId, sessionId),
      }),
    );

    const contents = (listed.Contents ?? []).filter((obj): obj is { Key: string; Size?: number } =>
      Boolean(obj.Key),
    );
    contents.sort((a, b) => a.Key.localeCompare(b.Key));

    return contents.map(({ Key, Size }) => ({
      filename: Key.split('/').pop() ?? Key,
      sizeBytes: Size ?? 0,
    }));
  },

  async getSegment(siteId, sessionId, filename) {
    try {
      const object = await getS3Client().send(
        new GetObjectCommand({
          Bucket: getBucket(),
          Key: segmentPrefix(siteId, sessionId) + filename,
        }),
      );
      if (!object.Body) return null;
      return {
        body: object.Body.transformToWebStream(),
        ...(object.ContentEncoding ? { contentEncoding: object.ContentEncoding } : {}),
      };
    } catch (error) {
      if (error instanceof NoSuchKey) return null;
      throw error;
    }
  },
};
