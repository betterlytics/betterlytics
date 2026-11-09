// Claude's hosted connector moved from claude.ai to claude.com; clients registered with one return to either
const CLAUDE_CALLBACKS = ['https://claude.ai/api/mcp/auth_callback', 'https://claude.com/api/mcp/auth_callback'];

export function isLoopbackHost(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '[::1]') return true;
  const octets = hostname.split('.');
  return (
    octets.length === 4 && octets[0] === '127' && octets.every((o) => /^\d{1,3}$/.test(o) && Number(o) <= 255)
  );
}

/** A loopback redirect without its host and port, so `localhost:1234` and `127.0.0.1:5678` compare equal. */
function loopbackRedirectShape(uri: string): string | null {
  if (uri.includes('#')) return null;
  try {
    const url = new URL(uri);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (url.username || url.password || !isLoopbackHost(url.hostname)) return null;
    return `${url.protocol}${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}

export function isLoopbackRedirect(uri: string): boolean {
  return loopbackRedirectShape(uri) !== null;
}

/**
 * Beyond the library's exact match: a native client (Claude Code, Cursor) that registered a loopback redirect may
 * come back on any loopback host and port, and a client registered with one of Claude's hosted callbacks may use
 * the other. Nothing is accepted that the client didn't register in some form.
 */
export function acceptMcpRedirectUri(
  uri: string,
  registeredUris: readonly string[],
  defaultResult: boolean,
): boolean {
  if (defaultResult) return true;

  const shape = loopbackRedirectShape(uri);
  if (shape) return registeredUris.some((registered) => loopbackRedirectShape(registered) === shape);

  if (CLAUDE_CALLBACKS.includes(uri))
    return registeredUris.some((registered) => CLAUDE_CALLBACKS.includes(registered));
  return false;
}
