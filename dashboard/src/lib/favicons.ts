export function normalizeDomainForFavicon(domain?: string | null): string | null {
  if (!domain) {
    return null;
  }

  return domain
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0]
    .toLowerCase();
}

// Placeholder labels such as the demo sidebar's "Demo Dashboard" flow through the same prop as
// real domains; building a request for them only earns a 404 from the favicon route.
function isDomainShaped(normalized: string): boolean {
  return !/\s/.test(normalized) && normalized.includes('.');
}

export function getFaviconUrl(domain?: string | null): string | null {
  const normalized = normalizeDomainForFavicon(domain);

  if (!normalized || !isDomainShaped(normalized)) {
    return null;
  }

  const encodedDomain = encodeURIComponent(normalized);

  return `/api/favicons?domain=${encodedDomain}`;
}
