import 'server-only';

import { env } from '@/lib/env';
import { sharedEmailEnv } from '@/lib/env/shared.env';
import { findStatusPageByCustomDomain } from '@/repositories/postgres/statusPage.repository';
import { canUseStatusPageCustomDomain } from '@/lib/billing/capabilityAccess';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { isOwnHost, normalizeHostname, ownHostsFrom } from '@/lib/status-host-routing';

export type TlsAuthorization = 'authorized' | 'forbidden' | 'unauthorized';

const OWN_HOSTS = ownHostsFrom(
  sharedEmailEnv.publicBaseUrl,
  sharedEmailEnv.isCloud ? env.STATUS_PAGE_DOMAIN : '',
  sharedEmailEnv.isCloud,
);

/** Rejects our own hosts so they can never be claimed as a custom domain; same policy the middleware routes by. */
export function isOwnNamespace(domain: string): boolean {
  return isOwnHost(domain, OWN_HOSTS);
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
