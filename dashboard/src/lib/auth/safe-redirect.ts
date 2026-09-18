const PLACEHOLDER_ORIGIN = 'http://placeholder.invalid';

/**
 * Accepts only same-origin absolute paths so a callback parameter can never send the
 * browser off-site. Resolved against a placeholder origin: anything that escapes it
 * (scheme, `//host`, backslash or control-character tricks) falls back.
 */
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
