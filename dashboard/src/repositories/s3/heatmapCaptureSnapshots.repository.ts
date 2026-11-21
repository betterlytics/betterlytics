import 'server-only';

import { DeleteObjectCommand, GetObjectCommand, NoSuchKey } from '@aws-sdk/client-s3';
import { getS3Client } from '@/lib/s3-client';
import { s3Env } from '@/lib/env';
import type { HeatmapCaptureSnapshotStore } from '@/repositories/heatmapCaptureSnapshots.repository';

// Keys are written by the backend under heatmap-captures/site/<siteId>/, outside the replay prefix
function ownedKey(siteId: string, key: string): string {
  if (!key.startsWith(`heatmap-captures/site/${siteId}/`)) {
    throw new Error('Heatmap capture key does not belong to this site');
  }
  return key;
}

function getBucket(): string {
  if (!s3Env.bucket) {
    throw new Error('S3 bucket is not configured');
  }
  return s3Env.bucket;
}

export const s3CaptureSnapshotStore: HeatmapCaptureSnapshotStore = {
  async get(siteId, key) {
    try {
      const object = await getS3Client().send(
        new GetObjectCommand({ Bucket: getBucket(), Key: ownedKey(siteId, key) }),
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

  async delete(siteId, key) {
    await getS3Client().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: ownedKey(siteId, key) }));
  },
};
