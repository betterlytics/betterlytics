import 'server-only';
import { BlockList, isIP, type LookupFunction } from 'node:net';
import { lookup } from 'node:dns/promises';

// Mirrors classify_ip in backend/src/monitor/guard.rs; keep the two range lists in sync.

type AddressClass = 'public' | 'private' | 'blocked';
type Subnet = [network: string, prefix: number, family: 'ipv4' | 'ipv6'];

function buildList(subnets: Subnet[]): BlockList {
  const list = new BlockList();
  for (const [network, prefix, family] of subnets) list.addSubnet(network, prefix, family);
  return list;
}

// BlockList matches ::ffff:a.b.c.d against IPv4 rules, so mapped addresses need no special case.
const ALWAYS_BLOCKED = buildList([
  ['0.0.0.0', 8, 'ipv4'],
  ['127.0.0.0', 8, 'ipv4'],
  ['169.254.0.0', 16, 'ipv4'],
  ['100.100.100.200', 32, 'ipv4'],
  ['192.0.2.0', 24, 'ipv4'],
  ['198.51.100.0', 24, 'ipv4'],
  ['203.0.113.0', 24, 'ipv4'],
  ['224.0.0.0', 3, 'ipv4'],
  ['::', 128, 'ipv6'],
  ['::1', 128, 'ipv6'],
  ['fe80::', 10, 'ipv6'],
  ['ff00::', 8, 'ipv6'],
  ['fd00:ec2::254', 128, 'ipv6'],
]);

const PRIVATE = buildList([
  ['10.0.0.0', 8, 'ipv4'],
  ['172.16.0.0', 12, 'ipv4'],
  ['192.168.0.0', 16, 'ipv4'],
  ['100.64.0.0', 10, 'ipv4'],
  ['fc00::', 7, 'ipv6'],
]);

const NAT64 = buildList([['64:ff9b::', 96, 'ipv6']]);

// guard.rs classify_v6: the low 32 bits of 64:ff9b::/96 are the IPv4 target
function nat64Target(address: string): string | null {
  if (isIP(address) !== 6 || !NAT64.check(address, 'ipv6')) return null;
  const tail = address.slice(address.lastIndexOf(':') + 1);
  if (isIP(tail) === 4) return tail;
  const [high, low] = address
    .split(':')
    .slice(-2)
    .map((group) => parseInt(group || '0', 16));
  return [high >> 8, high & 0xff, low >> 8, low & 0xff].join('.');
}

export function classifyAddress(address: string): AddressClass {
  const embedded = nat64Target(address);
  if (embedded) return classifyAddress(embedded);
  const family = isIP(address) === 6 ? 'ipv6' : 'ipv4';
  if (ALWAYS_BLOCKED.check(address, family)) return 'blocked';
  if (PRIVATE.check(address, family)) return 'private';
  return 'public';
}

export function isAddressAllowed(address: string, allowPrivateTargets: boolean): boolean {
  const addressClass = classifyAddress(address);
  return addressClass === 'public' || (addressClass === 'private' && allowPrivateTargets);
}

export type TargetVerdict = 'allowed' | 'mixed' | 'blocked' | 'unresolved' | 'invalid';

export type Resolver = (hostname: string) => Promise<string[]>;

const resolveAll: Resolver = async (hostname) =>
  (await lookup(hostname, { all: true })).map((entry) => entry.address);

function parseUrl(rawUrl: string): URL | null {
  try {
    return new URL(rawUrl);
  } catch {
    return null;
  }
}

export function urlHostname(url: URL): string {
  return url.hostname.replace(/^\[|\]$/g, '');
}

// Scheme-agnostic: monitors allow http everywhere, webhooks add their own scheme rule in checkWebhookUrl.
export async function checkTargetUrl(
  rawUrl: string,
  allowPrivateTargets: boolean,
  resolve: Resolver = resolveAll,
): Promise<TargetVerdict> {
  const url = parseUrl(rawUrl);
  const hostname = url ? urlHostname(url) : '';
  if (!hostname) return 'invalid';

  let addresses: string[];
  try {
    addresses = isIP(hostname) ? [hostname] : await resolve(hostname);
  } catch {
    return 'unresolved';
  }
  if (addresses.length === 0) return 'unresolved';

  const allowedCount = addresses.filter((address) => isAddressAllowed(address, allowPrivateTargets)).length;
  if (allowedCount === addresses.length) return 'allowed';
  return allowedCount === 0 ? 'blocked' : 'mixed';
}

export async function checkWebhookUrl(
  rawUrl: string,
  allowPrivateTargets: boolean,
  resolve: Resolver = resolveAll,
): Promise<TargetVerdict> {
  const url = parseUrl(rawUrl);
  if (!url) return 'invalid';
  const schemeAllowed = url.protocol === 'https:' || (allowPrivateTargets && url.protocol === 'http:');
  if (!schemeAllowed) return 'invalid';
  return checkTargetUrl(rawUrl, allowPrivateTargets, resolve);
}

// Dashboard counterpart of GuardedResolver in guard.rs: the socket only gets addresses the guard allows.
export function createGuardedLookup(allowPrivateTargets: boolean, resolve: Resolver = resolveAll): LookupFunction {
  return (hostname, options, callback) => {
    resolve(hostname).then(
      (addresses) => {
        const allowed = addresses
          .filter((address) => isAddressAllowed(address, allowPrivateTargets))
          .map((address) => ({ address, family: isIP(address) }));
        if (allowed.length === 0) {
          callback(Object.assign(new Error(`Blocked target: ${hostname}`), { code: 'EACCES' }), []);
          return;
        }
        // net asks with all: true when autoSelectFamily is on (default since Node 20), otherwise for one address
        if (options.all) callback(null, allowed);
        else callback(null, allowed[0].address, allowed[0].family);
      },
      (error) => callback(error, []),
    );
  };
}

// Keep in sync with the *_WEBHOOK rules in backend/src/monitor/guard.rs
type VendorWebhookRule = { hosts: readonly string[]; pathPrefix: string }; // ".suffix" entries match subdomains

const VENDOR_WEBHOOK_RULES = {
  discord: { hosts: ['discord.com'], pathPrefix: '/api/webhooks/' },
  slack: { hosts: ['hooks.slack.com'], pathPrefix: '/services/' },
  teams: { hosts: ['.webhook.office.com', '.logic.azure.com'], pathPrefix: '' },
} as const satisfies Record<string, VendorWebhookRule>;

export type WebhookVendor = keyof typeof VENDOR_WEBHOOK_RULES;

export function isVendorWebhookUrl(rawUrl: string, vendor: WebhookVendor): boolean {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return false;
  }
  // URL drops a default :443, so a non-empty port is a non-default one
  if (url.protocol !== 'https:' || url.port !== '' || url.username || url.password) return false;
  const rule: VendorWebhookRule = VENDOR_WEBHOOK_RULES[vendor];
  // hostname is already lowercased and IDNA/percent-decoded; IP literals and trailing dots never match
  const hostAllowed = rule.hosts.some((host) =>
    host.startsWith('.') ? url.hostname.endsWith(host) : url.hostname === host,
  );
  return hostAllowed && url.pathname.startsWith(rule.pathPrefix);
}
