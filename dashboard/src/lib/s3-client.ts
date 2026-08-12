import 'server-only';

import { S3Client } from '@aws-sdk/client-s3';
import { s3Env } from '@/lib/env';

let presignClient: S3Client | null = null;
let dataPlaneClient: S3Client | null = null;

function createClient(endpoint: string | undefined): S3Client {
  if (!s3Env.enabled) {
    throw new Error('S3 is disabled');
  }

  return new S3Client({
    region: s3Env.region,
    endpoint,
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

export function getS3Client(): S3Client {
  if (!presignClient) {
    presignClient = createClient(s3Env.endpoint);
  }

  return presignClient;
}

export function getS3DataPlaneClient(): S3Client {
  if (!dataPlaneClient) {
    dataPlaneClient = createClient(s3Env.internalEndpoint ?? s3Env.endpoint);
  }

  return dataPlaneClient;
}
