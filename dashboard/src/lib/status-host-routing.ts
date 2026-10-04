export function normalizeHostname(raw: string): string {
  return raw.trim().toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');
}

export function hostnameOf(urlOrHost: string): string {
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(urlOrHost) ? urlOrHost : `http://${urlOrHost}`;
  try {
    return new URL(withScheme).hostname;
  } catch {
    return urlOrHost;
  }
}

export type OwnHosts = {
  appHost: string;
  statusPageDomain: string;
  wildcard: boolean;
};

export function ownHostsFrom(publicBaseUrl: string, statusPageDomain: string, wildcard: boolean): OwnHosts {
  return {
    appHost: normalizeHostname(hostnameOf(publicBaseUrl)),
    statusPageDomain: normalizeHostname(statusPageDomain),
    wildcard,
  };
}

const IPV4_LITERAL = /^\d{1,3}(\.\d{1,3}){3}$/;

/**
 * The single reserved-host policy: middleware skips the custom-domain lookup for these hosts and
 * the status page actions refuse to claim them.
 */
export function isOwnHost(domain: string, own: OwnHosts): boolean {
  if (!domain.includes('.')) return true;
  if (domain.endsWith('.localhost')) return true;
  if (IPV4_LITERAL.test(domain) || domain.startsWith('[')) return true;
  if (domain === own.appHost || domain === `www.${own.appHost}`) return true;
  if (own.wildcard && domain.endsWith(`.${own.appHost}`)) return true;
  if (!own.statusPageDomain) return false;
  return domain === own.statusPageDomain || (own.wildcard && domain.endsWith(`.${own.statusPageDomain}`));
}

const STATUS_IMAGE_PATH = /^\/status\/[^/]+\/image\/[^/]+$/;

export type StatusHostClassification = 'status' | 'unknown' | 'unavailable';

export type StatusHostRoute =
  | { kind: 'pass' }
  | { kind: 'rewrite'; pathname: string }
  | { kind: 'notFound' }
  | { kind: 'unavailable' };

export function decideStatusHostRoute(
  classification: StatusHostClassification,
  domain: string,
  pathname: string,
  isCloud: boolean,
): StatusHostRoute {
  if (classification === 'unavailable') return { kind: 'unavailable' };
  // On cloud every non-own host that reaches us holds a cert on our IP, so no row means a removed
  // domain or the feature off; neither may see the app. Off cloud the app has hostnames we cannot know.
  if (classification === 'unknown') return isCloud ? { kind: 'notFound' } : { kind: 'pass' };
  if (pathname === '/') return { kind: 'rewrite', pathname: `/status/domain/${domain}` };
  if (STATUS_IMAGE_PATH.test(pathname)) return { kind: 'pass' };
  // Legacy: the production proxy still rewrites `/` to this path itself. Remove once it no longer does.
  if (pathname.toLowerCase().replace(/\.+$/, '') === `/status/domain/${domain}`) return { kind: 'pass' };
  return { kind: 'notFound' };
}
