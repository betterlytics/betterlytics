import 'server-only';

import type { HeatmapCaptureStorage } from '@/entities/analytics/heatmapCaptures.entities';
import { clickhouseCaptureSnapshotStore } from './clickhouse/heatmapCaptureSnapshots.repository';
import { s3CaptureSnapshotStore } from './s3/heatmapCaptureSnapshots.repository';

// Picked per capture from the storage its row recorded, never directly from env
export interface HeatmapCaptureSnapshotStore {
  // body: JSON text (clickhouse) or the stored byte stream (s3); contentEncoding is set when
  // the bytes are still compressed
  get(
    siteId: string,
    storageKey: string,
  ): Promise<{ body: string | ReadableStream; contentEncoding?: string } | null>;
  delete(siteId: string, storageKey: string): Promise<void>;
}

export function captureSnapshotStoreFor(storage: HeatmapCaptureStorage): HeatmapCaptureSnapshotStore {
  return storage === 'clickhouse' ? clickhouseCaptureSnapshotStore : s3CaptureSnapshotStore;
}
