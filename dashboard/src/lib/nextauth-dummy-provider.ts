import type { OAuthConfig } from 'next-auth/providers/oauth';

/**
 * Dummy provider for next-auth
 *
 * This is used as strategy 'database' fails for next-auth
 * if only CredentialsProvider is used.
 *
 */
export function DummyProvider(): OAuthConfig<unknown> {
  return {
    id: 'dummy',
    name: 'Dummy',
    type: 'oauth',

    clientId: 'dummy',
    clientSecret: 'dummy',

    authorization: {
      url: 'https://example.invalid/auth',
      params: {},
    },

    token: 'https://example.invalid/token',
    userinfo: 'https://example.invalid/me',

    profile() {
      throw new Error('Not allowed');
    },
  };
}
