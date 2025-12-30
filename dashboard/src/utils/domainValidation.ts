/**
 * Validates that a URL belongs to the expected domain or its subdomains.
 *
 * @param url - The URL to validate
 * @param domain - The base domain (e.g., "example.com")
 * @returns true if the URL's hostname matches the domain or is a subdomain
 *
 * @example
 * isUrlOnDomain("https://example.com/health", "example.com") // true
 * isUrlOnDomain("https://api.example.com/status", "example.com") // true
 * isUrlOnDomain("https://evil.com", "example.com") // false
 */
export function isUrlOnDomain(url: string, domain: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const baseDomain = domain.toLowerCase().replace(/^www\./, '');
    return hostname === baseDomain || hostname === `www.${baseDomain}` || hostname.endsWith(`.${baseDomain}`);
  } catch {
    return false;
  }
}

/**
 * Normalizes a URL for comparison/deduplication:
 * - Lowercases the hostname
 * - Removes trailing slashes from the path
 * - Ignores query parameters and fragments
 *
 * @param url - The URL to normalize
 * @returns Normalized URL with protocol (e.g. "https://betterlytics.io/track") or null if invalid
 */
export function normalizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    let path = parsed.pathname;
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }
    return `${parsed.protocol}//${parsed.hostname.toLowerCase()}${path}`;
  } catch {
    return null;
  }
}
