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

export function getFaviconUrl(domain?: string | null): string | null {
  const normalized = normalizeDomainForFavicon(domain);

  if (!normalized) {
    return null;
  }

  const encodedDomain = encodeURIComponent(normalized);

  return `/api/favicons?domain=${encodedDomain}`;
}
