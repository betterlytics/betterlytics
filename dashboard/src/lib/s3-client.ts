'server-only';

import { S3Client } from '@aws-sdk/client-s3';
import { s3Env } from '@/lib/env';

let client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!s3Env.enabled) {
    throw new Error('S3 is disabled');
  }

  if (!client) {
    client = new S3Client({
      region: s3Env.region,
      endpoint: s3Env.endpoint,
      forcePathStyle: s3Env.forcePathStyle,
      credentials:
        s3Env.accessKeyId && s3Env.secretAccessKey
          ? {
              accessKeyId: s3Env.accessKeyId,
              secretAccessKey: s3Env.secretAccessKey,
            }
          : undefined,
    });
  }

  return client;
}
