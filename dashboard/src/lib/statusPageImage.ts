import { imageSize } from 'image-size';
import {
  STATUS_PAGE_IMAGE_MIME,
  STATUS_PAGE_LIMITS,
  type StatusPageImageKind,
} from '@/entities/analytics/statusPage/statusPage.entities';
import { looksLikeSvg, sanitizeSvgLogo } from '@/lib/svgSanitizer';

const FORMAT_TO_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
};

export type InspectedStatusPageImage =
  | { ok: true; mimeType: string; data: Uint8Array }
  | { ok: false; reason: 'type' | 'svgRejected' };

/**
 * Validate an uploaded status-page image and produce the exact bytes to store.
 *
 * Rasters: sniffs the real format from the header bytes and reads the intrinsic dimensions to
 * reject oversized rasters / decompression bombs from a client that bypassed the canvas resize;
 * the original bytes are stored. SVG (logo only): the file must survive the strict sanitizer,
 * and its re-serialized output — never the original bytes — is what gets stored.
 */
export function inspectStatusPageImage(data: Uint8Array, kind: StatusPageImageKind): InspectedStatusPageImage {
  if (looksLikeSvg(data)) {
    if (kind !== 'logo') return { ok: false, reason: 'type' };
    const sanitized = sanitizeSvgLogo(data);
    return sanitized
      ? { ok: true, mimeType: 'image/svg+xml', data: sanitized }
      : { ok: false, reason: 'svgRejected' };
  }

  let result: ReturnType<typeof imageSize>;
  try {
    result = imageSize(data);
  } catch {
    return { ok: false, reason: 'type' };
  }

  const mimeType = result.type ? FORMAT_TO_MIME[result.type] : undefined;
  if (!mimeType || !STATUS_PAGE_IMAGE_MIME.has(mimeType)) return { ok: false, reason: 'type' };
  if (!result.width || !result.height) return { ok: false, reason: 'type' };
  if (
    result.width > STATUS_PAGE_LIMITS.IMAGE_MAX_DIMENSION ||
    result.height > STATUS_PAGE_LIMITS.IMAGE_MAX_DIMENSION
  ) {
    return { ok: false, reason: 'type' };
  }

  return { ok: true, mimeType, data };
}
