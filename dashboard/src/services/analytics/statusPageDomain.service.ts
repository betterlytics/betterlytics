import 'server-only';

import { env } from '@/lib/env';
import { findStatusPageByCustomDomain } from '@/repositories/postgres/statusPage.repository';
import { canUseStatusPageCustomDomain } from '@/lib/billing/capabilityAccess';

const OWN_APEX_DOMAINS = ['betterlytics.io', 'betterlytics.com'];

export type TlsAuthorization = 'authorized' | 'forbidden' | 'unauthorized';

export function normalizeHostname(raw: string): string {
  return raw.trim().toLowerCase().replace(/\.$/, '').replace(/:\d+$/, '');
}

/** Rejects our own status namespace + apex domains so they can never be claimed as a custom domain. */
export function isOwnNamespace(domain: string): boolean {
  const namespaces = [...OWN_APEX_DOMAINS, env.STATUS_PAGE_DOMAIN];
  return namespaces.some((ns) => domain === ns || domain.endsWith(`.${ns}`));
}

/**
 * Authorizes Caddy on-demand TLS for a hostname (called by the `ask` endpoint before issuance).
 * Option A — no ownership-verification step: a published status page must own the domain and the
 * dashboard's plan must include custom domains. ACME itself only issues for a host already pointed
 * at us, so pointing the CNAME is the implicit proof.
 */
export async function getTlsAuthorization(rawDomain: string): Promise<TlsAuthorization> {
  const domain = normalizeHostname(rawDomain);
  if (!domain) return 'unauthorized';
  if (isOwnNamespace(domain)) return 'forbidden';

  const page = await findStatusPageByCustomDomain(domain);
  if (!page || !page.isPublished) return 'unauthorized';

  const allowed = await canUseStatusPageCustomDomain(page.dashboardId);
  return allowed ? 'authorized' : 'unauthorized';
}
