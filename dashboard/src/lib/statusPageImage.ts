import { imageSize } from 'image-size';
import { STATUS_PAGE_IMAGE_MIME, STATUS_PAGE_LIMITS } from '@/entities/analytics/statusPage/statusPage.entities';

const FORMAT_TO_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
};

/**
 * Sniffs the real format from the file's header bytes and reads the intrinsic
 * dimensions to reject oversized rasters / decompression bombs from a client that bypassed the
 * canvas resize. Returns the canonical MIME to store, or null if the bytes aren't an accepted.
 */
export function inspectStatusPageImage(data: Uint8Array): { mimeType: string } | null {
  let result: ReturnType<typeof imageSize>;
  try {
    result = imageSize(data);
  } catch {
    return null;
  }

  const mimeType = result.type ? FORMAT_TO_MIME[result.type] : undefined;
  if (!mimeType || !STATUS_PAGE_IMAGE_MIME.has(mimeType)) return null;
  if (!result.width || !result.height) return null;
  if (
    result.width > STATUS_PAGE_LIMITS.IMAGE_MAX_DIMENSION ||
    result.height > STATUS_PAGE_LIMITS.IMAGE_MAX_DIMENSION
  ) {
    return null;
  }

  return { mimeType };
}
