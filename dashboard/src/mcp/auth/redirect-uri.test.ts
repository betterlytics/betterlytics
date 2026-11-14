import { describe, it, expect } from 'vitest';
import { acceptMcpRedirectUri, isLoopbackRedirect } from '@/mcp/auth/redirect-uri';

describe('acceptMcpRedirectUri', () => {
  it('keeps what the library already matched', () => {
    expect(acceptMcpRedirectUri('https://app.example.com/cb', ['https://app.example.com/cb'], true)).toBe(true);
  });

  it.each([
    'http://localhost:51823/callback',
    'http://127.0.0.1:40001/callback',
    'http://127.12.0.3:9/callback',
    'http://[::1]:3000/callback',
  ])('lets a registered loopback redirect come back on any loopback host and port: %s', (uri) => {
    expect(acceptMcpRedirectUri(uri, ['http://localhost:1234/callback'], false)).toBe(true);
  });

  it('needs the same path and scheme as the registered loopback redirect', () => {
    const registered = ['http://localhost:1234/callback'];
    expect(acceptMcpRedirectUri('http://localhost:5678/other', registered, false)).toBe(false);
    expect(acceptMcpRedirectUri('https://localhost:5678/callback', registered, false)).toBe(false);
  });

  it('accepts no loopback redirect for a client that registered none', () => {
    expect(
      acceptMcpRedirectUri('http://localhost:5678/callback', ['https://app.example.com/callback'], false),
    ).toBe(false);
  });

  it("swaps Claude's hosted callbacks only for a client registered with one", () => {
    expect(
      acceptMcpRedirectUri(
        'https://claude.com/api/mcp/auth_callback',
        ['https://claude.ai/api/mcp/auth_callback'],
        false,
      ),
    ).toBe(true);
    expect(
      acceptMcpRedirectUri('https://claude.com/api/mcp/auth_callback', ['http://localhost:1234/callback'], false),
    ).toBe(false);
  });

  it('refuses look-alike hosts and anything with credentials', () => {
    const registered = ['http://localhost:1234/callback'];
    expect(acceptMcpRedirectUri('http://localhost.evil.com:1234/callback', registered, false)).toBe(false);
    expect(acceptMcpRedirectUri('http://128.0.0.1:1234/callback', registered, false)).toBe(false);
    expect(acceptMcpRedirectUri('http://user:pw@localhost:1234/callback', registered, false)).toBe(false);
    expect(acceptMcpRedirectUri('https://evil.com/api/mcp/auth_callback', registered, false)).toBe(false);
  });
});

describe('isLoopbackRedirect', () => {
  it('tells loopback redirects from others', () => {
    expect(isLoopbackRedirect('http://127.0.0.1:40001/cb')).toBe(true);
    expect(isLoopbackRedirect('https://claude.ai/api/mcp/auth_callback')).toBe(false);
    expect(isLoopbackRedirect('cursor://callback')).toBe(false);
  });
});
