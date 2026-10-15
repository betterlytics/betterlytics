const PLACEHOLDER_ORIGIN = 'http://placeholder.invalid';

// Same-origin paths only; anything that escapes the placeholder origin is an open redirect.
// Accepts unknown because a repeated query key reaches us as an array, not the typed string.
export function toSafeRelativePath(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || !value.startsWith('/') || /[\s\\]/.test(value)) {
    return fallback;
  }
  try {
    const url = new URL(value, PLACEHOLDER_ORIGIN);
    // dot segments resolve after the host is settled: /.//evil.com comes out as //evil.com, which a browser reads as one
    if (url.origin !== PLACEHOLDER_ORIGIN || url.pathname.startsWith('//')) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
