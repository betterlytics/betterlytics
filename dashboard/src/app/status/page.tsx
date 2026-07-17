import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { isFeatureEnabled } from '@/lib/feature-flags';
import { getPublicStatusPageDataByDomain } from '@/services/analytics/publicStatusPage.service';
import { buildStatusPageMetadata, StatusPageShell } from '@/app/status/shared/statusPageShell';

/**
 * Custom-domain (tier-2) status host entry point. Caddy rewrites the custom domain's `/` to `/status`,
 * so the visited domain arrives only in the Host header — we resolve the page from that, not a path param.
 *
 * We trust `Host`, not `X-Forwarded-Host`: Caddy preserves the original Host upstream (no header_up
 * rewrite), it's the host on-demand TLS issued the cert for, and it's the same source tier-1 keys off.
 * A forwarded header would be spoofable if this app were ever reached without Caddy in front.
 *
 * Reading the header forces dynamic rendering; if tier-2 traffic ever warrants it, wrap the lookup in
 * `unstable_cache` keyed by host to restore a short serve-cache.
 */
const resolveStatusPage = cache(async () => {
  if (!isFeatureEnabled('enablePublicStatusPages')) {
    return null;
  }
  const host = (await headers()).get('host');
  if (!host) return null;
  return getPublicStatusPageDataByDomain(host);
});

export async function generateMetadata(): Promise<Metadata> {
  const data = await resolveStatusPage();
  // `manifest: null` opts out of the app-wide web manifest even on the not-found path.
  return data ? buildStatusPageMetadata(data) : { manifest: null };
}

export default async function PublicStatusPageByHost() {
  const data = await resolveStatusPage();
  if (!data) {
    notFound();
  }

  return <StatusPageShell data={data} />;
}
