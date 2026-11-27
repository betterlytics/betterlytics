import 'server-only';

import { promisify } from 'node:util';
import { gzip } from 'node:zlib';
import { NextResponse } from 'next/server';
import { createConcurrencyCap } from '@/lib/concurrency-cap';

const gzipAsync = promisify(gzip);

// A heatmap background is held in memory while it loads and compresses, up to 40 MB for a
// capture, so the capture and replay snapshot routes share a few loads per user and process
const MAX_LOADS_PER_USER = 3;
const MAX_LOADS_PER_PROCESS = 12;
const acquireLoadSlot = createConcurrencyCap(MAX_LOADS_PER_USER, MAX_LOADS_PER_PROCESS);

export async function withHeatmapSnapshotLoad(
  userId: string,
  load: () => Promise<NextResponse>,
): Promise<NextResponse> {
  const slot = acquireLoadSlot(userId);
  if ('refused' in slot) {
    return new NextResponse(null, { status: 429, headers: { 'Retry-After': '1' } });
  }
  try {
    return await load();
  } finally {
    slot.release();
  }
}

// Gzip is the payload, not a Content-Encoding: Next drops a route's own Content-Encoding and
// doesn't compress route handler responses, so the panel inflates the body
export function gzipJson(text: string): Promise<Buffer> {
  return gzipAsync(Buffer.from(text));
}
