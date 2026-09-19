const PLACEHOLDER_ORIGIN = 'http://placeholder.invalid';

// Same-origin paths only; anything that escapes the placeholder origin is an open redirect
export function toSafeRelativePath(value: string | null | undefined, fallback: string): string {
  if (!value || !value.startsWith('/') || /[\s\\]/.test(value)) {
    return fallback;
  }
  try {
    const url = new URL(value, PLACEHOLDER_ORIGIN);
    if (url.origin !== PLACEHOLDER_ORIGIN) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
