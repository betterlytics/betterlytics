const PLACEHOLDER_ORIGIN = 'http://placeholder.invalid';

// Same-origin paths only; anything that escapes the placeholder origin is an open redirect.
// Accepts unknown because a repeated query key reaches us as an array, not the typed string.
export function toSafeRelativePath(value: unknown, fallback: string): string {
  if (typeof value !== 'string' || !value.startsWith('/') || /[\s\\]/.test(value)) {
    return fallback;
  }
  try {
    const url = new URL(value, PLACEHOLDER_ORIGIN);
    if (url.origin !== PLACEHOLDER_ORIGIN) return fallback;
    const path = `${url.pathname}${url.search}${url.hash}`;
    // Dot segments collapse during parsing: `/.//evil.example` comes out as protocol-relative `//evil.example`.
    return path.startsWith('//') ? fallback : path;
  } catch {
    return fallback;
  }
}
