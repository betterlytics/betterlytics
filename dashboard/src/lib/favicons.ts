import { domainValidation } from '@/entities/dashboard/dashboard.entities';

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

  // The favicon route validates with this same schema, so placeholder labels like the demo
  // sidebar's "Demo Dashboard" would only earn a 404 — filter them before requesting.
  if (!domainValidation.safeParse(normalized).success) {
    return null;
  }

  const encodedDomain = encodeURIComponent(normalized);

  return `/api/favicons?domain=${encodedDomain}`;
}
