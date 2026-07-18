import 'server-only';

import { env } from '@/lib/env';
import { sharedEmailEnv } from '@/lib/env/shared.env';
import { findStatusPageByCustomDomain } from '@/repositories/postgres/statusPage.repository';
import { canUseStatusPageCustomDomain } from '@/lib/billing/capabilityAccess';
import { isFeatureEnabled } from '@/lib/feature-flags';

export type TlsAuthorization = 'authorized' | 'forbidden' | 'unauthorized';

export function normalizeHostname(raw: string): string {
  return raw.trim().toLowerCase().replace(/\.$/, '').replace(/:\d+$/, '');
}

function publicBaseUrlHost(): string {
  try {
    return new URL(sharedEmailEnv.publicBaseUrl).hostname;
  } catch {
    return sharedEmailEnv.publicBaseUrl; // tolerate a bare hostname without scheme
  }
}

// Hosts this install serves itself: the app origin and the tier-1 status namespace. Derived from
// config rather than hardcoded so self-host deployments are protected too.
const OWN_NAMESPACES = [publicBaseUrlHost(), env.STATUS_PAGE_DOMAIN].map(normalizeHostname).filter(Boolean);

/** Rejects our own hosts + status namespace so they can never be claimed as a custom domain. */
export function isOwnNamespace(domain: string): boolean {
  return OWN_NAMESPACES.some((ns) => domain === ns || domain.endsWith(`.${ns}`));
}

/**
 * Authorizes Caddy on-demand TLS for a hostname (called by the `ask` endpoint before issuance).
 * No ownership-verification step: a published status page must own the domain and the
 * dashboard's plan must include custom domains. ACME itself only issues for a host already pointed
 * at us, so pointing the CNAME is the implicit proof.
 */
export async function getTlsAuthorization(rawDomain: string): Promise<TlsAuthorization> {
  if (!isFeatureEnabled('enablePublicStatusPages')) return 'unauthorized';

  const domain = normalizeHostname(rawDomain);
  if (!domain) return 'unauthorized';
  if (isOwnNamespace(domain)) return 'forbidden';

  const page = await findStatusPageByCustomDomain(domain);
  if (!page || !page.isPublished) return 'unauthorized';

  const allowed = await canUseStatusPageCustomDomain(page.dashboardId);
  return allowed ? 'authorized' : 'unauthorized';
}
