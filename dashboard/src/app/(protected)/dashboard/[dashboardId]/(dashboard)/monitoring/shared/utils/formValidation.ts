import type { StatusCodeValue } from '@/entities/analytics/monitoring.entities';
import { MONITOR_LIMITS } from '@/entities/analytics/monitoring.entities';
import { stableStringify } from '@/utils/stableStringify';

export type StatusCodeValidationResult =
  | { ok: true; code: StatusCodeValue }
  | { ok: false; error: 'empty' | 'invalidRange' | 'invalidFormat' | 'outOfRange' | 'duplicate' | 'maxReached' };

export function validateStatusCode(input: string, existingCodes: StatusCodeValue[]): StatusCodeValidationResult {
  const normalized = input.trim().toLowerCase();

  if (!normalized) {
    return { ok: false, error: 'empty' };
  }

  if (existingCodes.length >= MONITOR_LIMITS.ACCEPTED_STATUS_CODES_MAX) {
    return { ok: false, error: 'maxReached' };
  }

  if (existingCodes.includes(normalized as StatusCodeValue)) {
    return { ok: false, error: 'duplicate' };
  }

  // Handle range patterns (2xx, 3xx, etc.)
  if (/^[2-5]xx$/.test(normalized)) {
    return { ok: true, code: normalized as StatusCodeValue };
  }

  // Reject invalid range patterns (0xx, 1xx, 6xx+)
  if (/^[0-9]xx$/.test(normalized)) {
    return { ok: false, error: 'invalidRange' };
  }

  // Parse numeric code
  const code = parseInt(normalized, 10);
  if (isNaN(code)) {
    return { ok: false, error: 'invalidFormat' };
  }

  if (code < 100 || code > 599) {
    return { ok: false, error: 'outOfRange' };
  }

  return { ok: true, code };
}

export function sortStatusCodes(codes: StatusCodeValue[]): StatusCodeValue[] {
  return [...codes].sort((a, b) => {
    const aStr = String(a);
    const bStr = String(b);
    const aIsRange = aStr.includes('x');
    const bIsRange = bStr.includes('x');
    if (aIsRange && !bIsRange) return -1;
    if (!aIsRange && bIsRange) return 1;
    return aStr.localeCompare(bStr);
  });
}

export function deepEqual<T>(a: T, b: T): boolean {
  return stableStringify(a) === stableStringify(b);
}

const BLOCKED_HEADERS = new Set([
  'host',
  'transfer-encoding',
  'content-length',
  'content-encoding',
  'accept-encoding',
  'connection',
  'upgrade',
  'keep-alive',
  'te',
  'trailer',
  'proxy-connection',
  'proxy-authenticate',
  'proxy-authorization',
  'forwarded',
  'x-forwarded-for',
  'x-forwarded-host',
  'x-forwarded-proto',
  'x-forwarded-port',
  'x-real-ip',
  'via',
  ':authority',
  ':method',
  ':path',
  ':scheme',
  'expect',
  'range',
]);

export function isHeaderBlocked(name: string): boolean {
  const lower = name.toLowerCase().trim();

  if (BLOCKED_HEADERS.has(lower)) {
    return true;
  }

  if (lower.startsWith('proxy-')) {
    return true;
  }

  return false;
}
