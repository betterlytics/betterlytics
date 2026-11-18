type HeaderValue = string | string[] | undefined;

const DEFAULT_PORTS: Record<string, string> = { 'http:': '80', 'https:': '443' };

function headerText(value: HeaderValue): string {
  return Array.isArray(value) ? value.join(',') : (value ?? '');
}

/**
 * Whether a page's response headers let `frameOrigin` show it in an iframe. A CSP
 * frame-ancestors directive decides when present (browsers then ignore X-Frame-Options);
 * otherwise any X-Frame-Options value blocks a different origin.
 */
export function allowsFraming(headers: Record<string, HeaderValue>, frameOrigin: string): boolean {
  // Several policies are all enforced, so every one with frame-ancestors has to allow it
  const ancestorLists = headerText(headers['content-security-policy'])
    .split(',')
    .map(frameAncestors)
    .filter((sources): sources is string[] => sources !== null);
  if (ancestorLists.length > 0) {
    return ancestorLists.every((sources) => sources.some((source) => sourceAllows(source, frameOrigin)));
  }
  return headerText(headers['x-frame-options']).trim() === '';
}

function frameAncestors(policy: string): string[] | null {
  for (const directive of policy.split(';')) {
    const [name, ...sources] = directive.trim().split(/\s+/);
    if (name?.toLowerCase() === 'frame-ancestors') return sources.map((source) => source.toLowerCase());
  }
  return null;
}

function sourceAllows(source: string, frameOrigin: string): boolean {
  const origin = new URL(frameOrigin);
  if (source === '*') return origin.protocol === 'http:' || origin.protocol === 'https:';
  // 'self' is the framed page's own origin, never the dashboard's
  if (source.startsWith("'")) return false;
  if (/^[a-z][a-z0-9+.-]*:$/.test(source)) {
    return source === origin.protocol || (source === 'http:' && origin.protocol === 'https:');
  }

  const match = /^(?:([a-z][a-z0-9+.-]*):\/\/)?(\*\.)?([^:/]+)(?::(\d+|\*))?(?:\/.*)?$/.exec(source);
  if (!match) return false;
  const [, scheme, wildcard, host, port] = match;
  if (scheme && `${scheme}:` !== origin.protocol && !(scheme === 'http' && origin.protocol === 'https:')) return false;
  const hostMatches = wildcard ? origin.hostname.endsWith(`.${host}`) : origin.hostname === host;
  if (!hostMatches) return false;
  const originPort = origin.port || DEFAULT_PORTS[origin.protocol];
  const sourcePort = port ?? DEFAULT_PORTS[scheme ? `${scheme}:` : origin.protocol];
  return sourcePort === '*' || sourcePort === originPort || (port === undefined && scheme === 'http' && originPort === '443');
}
