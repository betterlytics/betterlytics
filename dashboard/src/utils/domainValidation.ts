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
